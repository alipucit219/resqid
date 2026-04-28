// ─────────────────────────────────────────────────────────────────────────────
// In your MainApplication.java, find the getPackages() method and add
// AccessibilityModule to the packages list like this:
// ─────────────────────────────────────────────────────────────────────────────

// 1. Add these imports at the top of MainApplication.java:
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

// 2. Inside getPackages(), add this entry to the list:
packages.add(new ReactPackage() {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext ctx) {
        return Arrays.<NativeModule>asList(new AccessibilityModule(ctx));
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext ctx) {
        return Collections.emptyList();
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Your getPackages() should look something like this after the change:
//
// @Override
// protected List<ReactPackage> getPackages() {
//     List<ReactPackage> packages = new PackageList(this).getPackages();
//     packages.add(new ReactPackage() {
//         @Override
//         public List<NativeModule> createNativeModules(ReactApplicationContext ctx) {
//             return Arrays.<NativeModule>asList(new AccessibilityModule(ctx));
//         }
//         @Override
//         public List<ViewManager> createViewManagers(ReactApplicationContext ctx) {
//             return Collections.emptyList();
//         }
//     });
//     return packages;
// }
// ─────────────────────────────────────────────────────────────────────────────
