#include <napi.h>
#import <CoreGraphics/CoreGraphics.h>
#import <AppKit/AppKit.h>

// Get all on-screen windows sorted by z-order (top to bottom)
Napi::Array GetOnScreenWindows(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array result = Napi::Array::New(env);

    // Get menu bar height dynamically (handles notch displays)
    NSScreen *mainScreen = [NSScreen mainScreen];
    CGFloat menuBarHeight = mainScreen.frame.size.height - NSMaxY(mainScreen.visibleFrame);

    // Get window list - on-screen only, exclude desktop elements
    CFArrayRef windowList = CGWindowListCopyWindowInfo(
        kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements,
        kCGNullWindowID
    );

    if (windowList == NULL) {
        return result;
    }

    CFIndex count = CFArrayGetCount(windowList);
    uint32_t index = 0;

    for (CFIndex i = 0; i < count; i++) {
        CFDictionaryRef window = (CFDictionaryRef)CFArrayGetValueAtIndex(windowList, i);

        // Get window layer - skip if it's not a normal window (layer 0)
        CFNumberRef layerRef = (CFNumberRef)CFDictionaryGetValue(window, kCGWindowLayer);
        int layer = 0;
        if (layerRef) {
            CFNumberGetValue(layerRef, kCFNumberIntType, &layer);
        }

        // Only include normal windows (layer 0)
        if (layer != 0) continue;

        // Get bounds
        CFDictionaryRef boundsDict = (CFDictionaryRef)CFDictionaryGetValue(window, kCGWindowBounds);
        if (!boundsDict) continue;

        CGRect bounds;
        if (!CGRectMakeWithDictionaryRepresentation(boundsDict, &bounds)) continue;

        // Skip windows with zero size
        if (bounds.size.width <= 0 || bounds.size.height <= 0) continue;

        // Get window number
        CFNumberRef windowNumberRef = (CFNumberRef)CFDictionaryGetValue(window, kCGWindowNumber);
        uint32_t windowNumber = 0;
        if (windowNumberRef) {
            CFNumberGetValue(windowNumberRef, kCFNumberIntType, &windowNumber);
        }

        // Get owner name (app name)
        CFStringRef ownerNameRef = (CFStringRef)CFDictionaryGetValue(window, kCGWindowOwnerName);
        std::string ownerName = "";
        if (ownerNameRef) {
            const char* ownerNameCStr = CFStringGetCStringPtr(ownerNameRef, kCFStringEncodingUTF8);
            if (ownerNameCStr) {
                ownerName = ownerNameCStr;
            } else {
                CFIndex length = CFStringGetLength(ownerNameRef);
                CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
                char* buffer = new char[maxSize];
                if (CFStringGetCString(ownerNameRef, buffer, maxSize, kCFStringEncodingUTF8)) {
                    ownerName = buffer;
                }
                delete[] buffer;
            }
        }

        // Get window name (title)
        CFStringRef nameRef = (CFStringRef)CFDictionaryGetValue(window, kCGWindowName);
        std::string name = "";
        if (nameRef) {
            const char* nameCStr = CFStringGetCStringPtr(nameRef, kCFStringEncodingUTF8);
            if (nameCStr) {
                name = nameCStr;
            } else {
                CFIndex length = CFStringGetLength(nameRef);
                CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
                char* buffer = new char[maxSize];
                if (CFStringGetCString(nameRef, buffer, maxSize, kCFStringEncodingUTF8)) {
                    name = buffer;
                }
                delete[] buffer;
            }
        }

        // Get process ID
        CFNumberRef pidRef = (CFNumberRef)CFDictionaryGetValue(window, kCGWindowOwnerPID);
        int pid = 0;
        if (pidRef) {
            CFNumberGetValue(pidRef, kCFNumberIntType, &pid);
        }

        // Create JavaScript object
        Napi::Object windowObj = Napi::Object::New(env);
        windowObj.Set("windowNumber", Napi::Number::New(env, windowNumber));
        windowObj.Set("ownerName", Napi::String::New(env, ownerName));
        windowObj.Set("name", Napi::String::New(env, name));
        windowObj.Set("pid", Napi::Number::New(env, pid));

        // CGWindowBounds returns coordinates from top of screen
        // Subtract menu bar height to get coordinates relative to visible screen area
        Napi::Object boundsObj = Napi::Object::New(env);
        boundsObj.Set("x", Napi::Number::New(env, bounds.origin.x));
        boundsObj.Set("y", Napi::Number::New(env, bounds.origin.y - menuBarHeight));
        boundsObj.Set("width", Napi::Number::New(env, bounds.size.width));
        boundsObj.Set("height", Napi::Number::New(env, bounds.size.height));
        windowObj.Set("bounds", boundsObj);

        result[index++] = windowObj;
    }

    CFRelease(windowList);
    return result;
}

// Hit-test: find the topmost window at given coordinates
Napi::Object GetWindowAtPoint(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected (x: number, y: number)").ThrowAsJavaScriptException();
        return Napi::Object::New(env);
    }

    // Get menu bar height dynamically
    NSScreen *mainScreen = [NSScreen mainScreen];
    CGFloat menuBarHeight = mainScreen.frame.size.height - NSMaxY(mainScreen.visibleFrame);

    // Add menu bar height to input coordinates for CGWindowBounds comparison
    double x = info[0].As<Napi::Number>().DoubleValue();
    double y = info[1].As<Napi::Number>().DoubleValue() + menuBarHeight;
    CGPoint point = CGPointMake(x, y);

    // Get window list - on-screen only, sorted by z-order (top to bottom)
    CFArrayRef windowList = CGWindowListCopyWindowInfo(
        kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements,
        kCGNullWindowID
    );

    if (windowList == NULL) {
        return Napi::Object::New(env);
    }

    CFIndex count = CFArrayGetCount(windowList);
    Napi::Object result = Napi::Object::New(env);
    bool found = false;

    // Iterate through windows in z-order (already sorted top to bottom)
    for (CFIndex i = 0; i < count && !found; i++) {
        CFDictionaryRef window = (CFDictionaryRef)CFArrayGetValueAtIndex(windowList, i);

        // Check layer - only normal windows (layer 0)
        CFNumberRef layerRef = (CFNumberRef)CFDictionaryGetValue(window, kCGWindowLayer);
        int layer = 0;
        if (layerRef) {
            CFNumberGetValue(layerRef, kCFNumberIntType, &layer);
        }
        if (layer != 0) continue;

        // Get bounds
        CFDictionaryRef boundsDict = (CFDictionaryRef)CFDictionaryGetValue(window, kCGWindowBounds);
        if (!boundsDict) continue;

        CGRect bounds;
        if (!CGRectMakeWithDictionaryRepresentation(boundsDict, &bounds)) continue;

        // Check if point is within bounds
        if (CGRectContainsPoint(bounds, point)) {
            // Get window number
            CFNumberRef windowNumberRef = (CFNumberRef)CFDictionaryGetValue(window, kCGWindowNumber);
            uint32_t windowNumber = 0;
            if (windowNumberRef) {
                CFNumberGetValue(windowNumberRef, kCFNumberIntType, &windowNumber);
            }

            // Get owner name
            CFStringRef ownerNameRef = (CFStringRef)CFDictionaryGetValue(window, kCGWindowOwnerName);
            std::string ownerName = "";
            if (ownerNameRef) {
                const char* ownerNameCStr = CFStringGetCStringPtr(ownerNameRef, kCFStringEncodingUTF8);
                if (ownerNameCStr) {
                    ownerName = ownerNameCStr;
                } else {
                    CFIndex length = CFStringGetLength(ownerNameRef);
                    CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
                    char* buffer = new char[maxSize];
                    if (CFStringGetCString(ownerNameRef, buffer, maxSize, kCFStringEncodingUTF8)) {
                        ownerName = buffer;
                    }
                    delete[] buffer;
                }
            }

            // Get window name
            CFStringRef nameRef = (CFStringRef)CFDictionaryGetValue(window, kCGWindowName);
            std::string name = "";
            if (nameRef) {
                const char* nameCStr = CFStringGetCStringPtr(nameRef, kCFStringEncodingUTF8);
                if (nameCStr) {
                    name = nameCStr;
                } else {
                    CFIndex length = CFStringGetLength(nameRef);
                    CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
                    char* buffer = new char[maxSize];
                    if (CFStringGetCString(nameRef, buffer, maxSize, kCFStringEncodingUTF8)) {
                        name = buffer;
                    }
                    delete[] buffer;
                }
            }

            // Get PID
            CFNumberRef pidRef = (CFNumberRef)CFDictionaryGetValue(window, kCGWindowOwnerPID);
            int pid = 0;
            if (pidRef) {
                CFNumberGetValue(pidRef, kCFNumberIntType, &pid);
            }

            result.Set("windowNumber", Napi::Number::New(env, windowNumber));
            result.Set("ownerName", Napi::String::New(env, ownerName));
            result.Set("name", Napi::String::New(env, name));
            result.Set("pid", Napi::Number::New(env, pid));

            // Subtract menu bar height from y coordinate
            Napi::Object boundsObj = Napi::Object::New(env);
            boundsObj.Set("x", Napi::Number::New(env, bounds.origin.x));
            boundsObj.Set("y", Napi::Number::New(env, bounds.origin.y - menuBarHeight));
            boundsObj.Set("width", Napi::Number::New(env, bounds.size.width));
            boundsObj.Set("height", Napi::Number::New(env, bounds.size.height));
            result.Set("bounds", boundsObj);

            found = true;
        }
    }

    CFRelease(windowList);
    return result;
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getOnScreenWindows", Napi::Function::New(env, GetOnScreenWindows));
    exports.Set("getWindowAtPoint", Napi::Function::New(env, GetWindowAtPoint));
    return exports;
}

NODE_API_MODULE(window_helper, Init)
