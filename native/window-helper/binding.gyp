{
  "targets": [
    {
      "target_name": "window_helper",
      "sources": ["window_helper.mm"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "xcode_settings": {
        "OTHER_CFLAGS": ["-ObjC++", "-std=c++17"],
        "OTHER_LDFLAGS": ["-framework CoreGraphics", "-framework AppKit"]
      },
      "conditions": [
        ["OS=='mac'", {
          "sources": ["window_helper.mm"]
        }]
      ]
    }
  ]
}
