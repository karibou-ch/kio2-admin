# kio2-admin

* helper for shoppers
* helper for shops

# Install
# Compile
  $ ionic cordova build android --aot --minifycss --optimizejs

# Testing on device
  $ ionic cordova run android --aot --minifycss --optimizejs --device
  * to deploy the application, follow the rules https://ionicframework.com/docs/intro/deploying/
# Debug
  $ adb logcat CordovaLog:D *:S

# Compatibility
  $ cordova plugin add cordova-plugin-crosswalk-webview

`INSTALL_FAILED_UPDATE_INCOMPATIBLE` is an Android error that means an apk cannot be installed because its signature is incompatible with the currently installed version. This happens when you try to update a signed release build with a debug build for instance. The solution is to uninstall the existing app from the device.