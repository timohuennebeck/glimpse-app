package app.glimpse.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.net.URL

/**
 * The app half of the homescreen widget.
 *
 * A widget runs in the launcher's process: no JS runtime, no network. It can
 * only read what the app has already written — a JSON snapshot in
 * SharedPreferences and the photo as a file in the app's own files dir. Both
 * names below are read back verbatim by `GlimpseWidgetProvider`; change one and
 * the widget silently renders its empty state.
 */
class GlimpseWidgetModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw MissingContextException()

  override fun definition() = ModuleDefinition {
    Name("GlimpseWidget")

    Function("isAvailable") { true }

    AsyncFunction("writeSnapshot") { json: String ->
      context
        .getSharedPreferences(GlimpseWidgetProvider.PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(GlimpseWidgetProvider.SNAPSHOT_KEY, json)
        .apply()
    }

    /**
     * Pulls the moment's photo into the files dir under `fileName`.
     *
     * The widget cannot fetch a signed URL itself, so unless this runs first it
     * draws a snapshot whose image is missing. Downloads to a staging file and
     * renames it, so a half-written photo is never decoded.
     */
    AsyncFunction("cacheImage") { url: String, fileName: String ->
      val destination = File(context.filesDir, fileName)
      val staging = File(context.filesDir, ".$fileName.part")
      URL(url).openStream().use { input ->
        staging.outputStream().use { output -> input.copyTo(output) }
      }
      if (destination.exists()) destination.delete()
      if (!staging.renameTo(destination)) {
        staging.delete()
        throw ImageCacheException(fileName)
      }
    }

    /** Drops every cached photo but the one the current snapshot names. */
    AsyncFunction("pruneImages") { keep: String? ->
      context.filesDir.listFiles()?.forEach { file ->
        if (file.name.endsWith(".jpg") && file.name != keep) file.delete()
      }
    }

    AsyncFunction("reloadWidget") {
      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, GlimpseWidgetProvider::class.java)
      val ids = manager.getAppWidgetIds(component)
      if (ids.isEmpty()) return@AsyncFunction
      context.sendBroadcast(
        Intent(context, GlimpseWidgetProvider::class.java).apply {
          action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
          putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        },
      )
    }
  }
}

internal class MissingContextException :
  CodedException("The Android context was not available to the widget module")

internal class ImageCacheException(name: String) :
  CodedException("Could not move the cached widget photo into place: $name")
