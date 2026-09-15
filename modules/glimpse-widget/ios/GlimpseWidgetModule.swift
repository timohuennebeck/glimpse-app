import ExpoModulesCore
import WidgetKit

/**
 The app half of the homescreen widget.

 The widget process has no JS runtime and no network, so it can only read what
 the app has already put in the shared App Group container: a JSON snapshot in
 `UserDefaults`, and the photo as a plain file. Both names below are read back
 verbatim by `widgets/ios/GlimpseWidget/GlimpseWidget.swift` — change one and
 the widget silently renders its empty state.
 */
public class GlimpseWidgetModule: Module {
  private static let appGroup = "group.app.glimpse.mobile"
  private static let snapshotKey = "glimpse.widget.snapshot"

  public func definition() -> ModuleDefinition {
    Name("GlimpseWidget")

    /** True when the App Group is reachable — false in a build without the entitlement. */
    Function("isAvailable") { () -> Bool in
      UserDefaults(suiteName: Self.appGroup) != nil
    }

    AsyncFunction("writeSnapshot") { (json: String) in
      guard let defaults = UserDefaults(suiteName: Self.appGroup) else {
        throw AppGroupUnavailableException()
      }
      defaults.set(json, forKey: Self.snapshotKey)
    }

    /**
     Pulls the moment's photo into the shared container under `fileName`.

     The widget cannot fetch a signed URL itself, so unless this runs first it
     draws a snapshot whose image is missing. Writes to a temporary file and
     moves it into place, so a half-downloaded photo is never rendered.
     */
    AsyncFunction("cacheImage") { (url: String, fileName: String) in
      guard let container = FileManager.default
        .containerURL(forSecurityApplicationGroupIdentifier: Self.appGroup)
      else { throw AppGroupUnavailableException() }
      guard let source = URL(string: url) else { throw BadImageURLException(url) }

      let data = try Data(contentsOf: source)
      let destination = container.appendingPathComponent(fileName)
      let staging = container.appendingPathComponent(".\(fileName).part")

      try data.write(to: staging, options: .atomic)
      if FileManager.default.fileExists(atPath: destination.path) {
        try FileManager.default.removeItem(at: destination)
      }
      try FileManager.default.moveItem(at: staging, to: destination)
    }

    /** Drops every cached photo but the one the current snapshot names. */
    AsyncFunction("pruneImages") { (keep: String?) in
      guard let container = FileManager.default
        .containerURL(forSecurityApplicationGroupIdentifier: Self.appGroup)
      else { return }
      let files = try FileManager.default.contentsOfDirectory(atPath: container.path)
      for file in files where file.hasSuffix(".jpg") && file != keep {
        try? FileManager.default.removeItem(at: container.appendingPathComponent(file))
      }
    }

    AsyncFunction("reloadWidget") {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}

internal final class AppGroupUnavailableException: Exception {
  override var reason: String {
    "App Group \(GlimpseWidgetModule.self) is not reachable. The build is missing the "
      + "com.apple.security.application-groups entitlement."
  }
}

internal final class BadImageURLException: GenericException<String> {
  override var reason: String { "Not a URL the widget can cache: \(param)" }
}
