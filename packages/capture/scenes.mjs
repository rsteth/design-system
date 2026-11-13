export const PROFILES = [
  {
    "id": "stethem-thumb",
    "title": "stethem.com thumbnail",
    "group": "Website",
    "viewport": {
      "width": 1200,
      "height": 900
    },
    "deviceScaleFactor": 1,
    "output": {
      "width": 1200,
      "height": 900
    },
    "description": "Intentional 4:3 scene. Original plus 800 × 600 downsample, never cropped.",
    "derivative": {
      "width": 800,
      "height": 600
    }
  },
  {
    "id": "desktop",
    "title": "Desktop",
    "group": "Web",
    "viewport": {
      "width": 1440,
      "height": 900
    },
    "deviceScaleFactor": 1,
    "output": {
      "width": 1440,
      "height": 900
    },
    "description": "Responsive desktop app scene at 1440 × 900 CSS pixels."
  },
  {
    "id": "mobile",
    "title": "Mobile",
    "group": "Web",
    "viewport": {
      "width": 390,
      "height": 844
    },
    "deviceScaleFactor": 3,
    "output": {
      "width": 1170,
      "height": 2532
    },
    "description": "Responsive mobile web scene at 390 × 844 CSS pixels, rendered at 3× density."
  },
  {
    "id": "app-store-iphone-6-3",
    "title": "iPhone · medium Dynamic Island",
    "group": "App Store dimensions",
    "viewport": {
      "width": 402,
      "height": 874
    },
    "deviceScaleFactor": 3,
    "output": {
      "width": 1206,
      "height": 2622
    },
    "description": "1206 × 2622 portrait. Required iPhone display class in the verified Apple specification.",
    "appStore": {
      "platform": "iOS",
      "deviceClass": "iPhone with Dynamic Island (medium display)",
      "nativeCapture": false
    }
  },
  {
    "id": "app-store-iphone-6-9",
    "title": "iPhone · large Dynamic Island",
    "group": "App Store dimensions",
    "viewport": {
      "width": 440,
      "height": 956
    },
    "deviceScaleFactor": 3,
    "output": {
      "width": 1320,
      "height": 2868
    },
    "description": "1320 × 2868 portrait. Additional large-display iPhone coverage.",
    "appStore": {
      "platform": "iOS",
      "deviceClass": "iPhone with Dynamic Island (large display)",
      "nativeCapture": false
    }
  },
  {
    "id": "app-store-ipad-13",
    "title": "iPad · 13-inch",
    "group": "App Store dimensions",
    "viewport": {
      "width": 1032,
      "height": 1376
    },
    "deviceScaleFactor": 2,
    "output": {
      "width": 2064,
      "height": 2752
    },
    "description": "2064 × 2752 portrait. Required when the app supports iPadOS.",
    "appStore": {
      "platform": "iPadOS",
      "deviceClass": "iPad 13-inch",
      "nativeCapture": false
    }
  },
  {
    "id": "app-store-mac",
    "title": "Mac · 16:10",
    "group": "App Store dimensions",
    "viewport": {
      "width": 1440,
      "height": 900
    },
    "deviceScaleFactor": 2,
    "output": {
      "width": 2880,
      "height": 1800
    },
    "description": "2880 × 1800 landscape. For Mac app metadata, not a native Mac app capture.",
    "appStore": {
      "platform": "macOS",
      "deviceClass": "Mac",
      "nativeCapture": false
    }
  }
]
;
