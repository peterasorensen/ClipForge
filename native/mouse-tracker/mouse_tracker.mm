#include <napi.h>
#include <CoreGraphics/CoreGraphics.h>
#include <CoreFoundation/CoreFoundation.h>
#include <ApplicationServices/ApplicationServices.h>
#include <vector>
#include <chrono>
#include <mutex>

// Structure to store mouse position with timestamp
struct MousePosition {
    double x;
    double y;
    double timestamp; // milliseconds since recording start
};

class MouseTracker {
private:
    CFMachPortRef eventTap;
    CFRunLoopSourceRef runLoopSource;
    bool isTracking;
    std::vector<MousePosition> positions;
    std::chrono::steady_clock::time_point startTime;
    std::mutex dataMutex;

    static CGEventRef eventCallback(CGEventTapProxy proxy, CGEventType type,
                                   CGEventRef event, void *refcon) {
        MouseTracker *tracker = static_cast<MouseTracker*>(refcon);

        if (type == kCGEventMouseMoved ||
            type == kCGEventLeftMouseDragged ||
            type == kCGEventRightMouseDragged) {

            CGPoint location = CGEventGetLocation(event);
            auto now = std::chrono::steady_clock::now();
            auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
                now - tracker->startTime
            ).count();

            MousePosition pos;
            pos.x = location.x;
            pos.y = location.y;
            pos.timestamp = static_cast<double>(elapsed);

            std::lock_guard<std::mutex> lock(tracker->dataMutex);
            tracker->positions.push_back(pos);

            // Limit to last 10000 positions to prevent memory issues
            if (tracker->positions.size() > 10000) {
                tracker->positions.erase(tracker->positions.begin());
            }
        }

        return event;
    }

public:
    MouseTracker() : eventTap(nullptr), runLoopSource(nullptr), isTracking(false) {}

    ~MouseTracker() {
        stopTracking();
    }

    bool startTracking() {
        if (isTracking) {
            return false;
        }

        // Create an event tap
        CGEventMask eventMask = CGEventMaskBit(kCGEventMouseMoved) |
                               CGEventMaskBit(kCGEventLeftMouseDragged) |
                               CGEventMaskBit(kCGEventRightMouseDragged);

        eventTap = CGEventTapCreate(
            kCGHIDEventTap,
            kCGHeadInsertEventTap,
            kCGEventTapOptionListenOnly,
            eventMask,
            eventCallback,
            this
        );

        if (!eventTap) {
            return false;
        }

        runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, eventTap, 0);
        CFRunLoopAddSource(CFRunLoopGetCurrent(), runLoopSource, kCFRunLoopCommonModes);
        CGEventTapEnable(eventTap, true);

        startTime = std::chrono::steady_clock::now();
        isTracking = true;
        positions.clear();

        return true;
    }

    void stopTracking() {
        if (!isTracking) {
            return;
        }

        if (eventTap) {
            CGEventTapEnable(eventTap, false);
            CFRelease(eventTap);
            eventTap = nullptr;
        }

        if (runLoopSource) {
            CFRunLoopRemoveSource(CFRunLoopGetCurrent(), runLoopSource, kCFRunLoopCommonModes);
            CFRelease(runLoopSource);
            runLoopSource = nullptr;
        }

        isTracking = false;
    }

    std::vector<MousePosition> getPositions() {
        std::lock_guard<std::mutex> lock(dataMutex);
        return positions;
    }

    void clearPositions() {
        std::lock_guard<std::mutex> lock(dataMutex);
        positions.clear();
        startTime = std::chrono::steady_clock::now();
    }

    bool getIsTracking() const {
        return isTracking;
    }
};

// Global tracker instance
static MouseTracker* globalTracker = nullptr;

// N-API wrapper functions
Napi::Value StartTracking(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!globalTracker) {
        globalTracker = new MouseTracker();
    }

    bool success = globalTracker->startTracking();
    return Napi::Boolean::New(env, success);
}

Napi::Value StopTracking(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (globalTracker) {
        globalTracker->stopTracking();
    }

    return env.Undefined();
}

Napi::Value GetPositions(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!globalTracker) {
        return Napi::Array::New(env, 0);
    }

    std::vector<MousePosition> positions = globalTracker->getPositions();
    Napi::Array result = Napi::Array::New(env, positions.size());

    for (size_t i = 0; i < positions.size(); i++) {
        Napi::Object pos = Napi::Object::New(env);
        pos.Set("x", Napi::Number::New(env, positions[i].x));
        pos.Set("y", Napi::Number::New(env, positions[i].y));
        pos.Set("timestamp", Napi::Number::New(env, positions[i].timestamp));
        result[i] = pos;
    }

    return result;
}

Napi::Value ClearPositions(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (globalTracker) {
        globalTracker->clearPositions();
    }

    return env.Undefined();
}

Napi::Value IsTracking(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    bool tracking = globalTracker ? globalTracker->getIsTracking() : false;
    return Napi::Boolean::New(env, tracking);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("startTracking", Napi::Function::New(env, StartTracking));
    exports.Set("stopTracking", Napi::Function::New(env, StopTracking));
    exports.Set("getPositions", Napi::Function::New(env, GetPositions));
    exports.Set("clearPositions", Napi::Function::New(env, ClearPositions));
    exports.Set("isTracking", Napi::Function::New(env, IsTracking));

    return exports;
}

NODE_API_MODULE(mouse_tracker, Init)
