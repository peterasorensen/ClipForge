{
  "targets": [
    {
      "target_name": "mouse_tracker",
      "sources": ["mouse_tracker.mm"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "xcode_settings": {
        "OTHER_CFLAGS": ["-ObjC++", "-std=c++17"],
        "OTHER_LDFLAGS": [
          "-framework CoreGraphics",
          "-framework CoreFoundation",
          "-framework ApplicationServices"
        ]
      },
      "conditions": [
        ["OS=='mac'", {
          "sources": ["mouse_tracker.mm"]
        }]
      ]
    }
  ]
}
