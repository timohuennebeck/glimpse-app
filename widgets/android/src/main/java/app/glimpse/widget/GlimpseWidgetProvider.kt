package app.glimpse.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONObject
import java.io.File

/**
 * The Android half of the Glimpse widget.
 *
 * Android widgets are RemoteViews, not Compose and not React — the widget
 * process cannot run app code. So, mirroring iOS, this reads a snapshot the app
 * writes to SharedPreferences plus a cached bitmap on disk.
 *
 * The app writes that snapshot through the same `publishSnapshot()` bridge used
 * on iOS; only the storage mechanism differs.
 */
class GlimpseWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS = "glimpse_widget"
        const val SNAPSHOT_KEY = "glimpse.widget.snapshot"
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        appWidgetIds.forEach { id -> render(context, appWidgetManager, id) }
    }

    private fun render(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.glimpse_widget)
        val snapshot = readSnapshot(context)
        val moment = snapshot?.optJSONObject("moment")

        if (moment == null) {
            views.setViewVisibility(R.id.widget_content, android.view.View.GONE)
            views.setViewVisibility(R.id.widget_empty, android.view.View.VISIBLE)
        } else {
            views.setViewVisibility(R.id.widget_content, android.view.View.VISIBLE)
            views.setViewVisibility(R.id.widget_empty, android.view.View.GONE)

            views.setTextViewText(R.id.widget_sender, moment.optString("fromName"))
            views.setTextViewText(R.id.widget_caption, moment.optString("caption", ""))

            // The bitmap on disk is already the server's blurred rendition while
            // the trade is locked — we never hold the original early.
            val file = File(context.filesDir, moment.optString("imageFile"))
            if (file.exists()) {
                BitmapFactory.decodeFile(file.absolutePath)?.let { bitmap ->
                    views.setImageViewBitmap(R.id.widget_photo, bitmap)
                }
            }

            views.setViewVisibility(
                R.id.widget_lock,
                if (moment.optBoolean("locked", true)) android.view.View.VISIBLE
                else android.view.View.GONE,
            )

            // Tapping opens the camera, never the photo.
            val tradeId = moment.optString("tradeId")
            val intent = Intent(
                Intent.ACTION_VIEW,
                Uri.parse("glimpse://camera?trade=$tradeId"),
            )
            val pending = PendingIntent.getActivity(
                context,
                widgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            views.setOnClickPendingIntent(R.id.widget_root, pending)
        }

        manager.updateAppWidget(widgetId, views)
    }

    private fun readSnapshot(context: Context): JSONObject? {
        val raw = context
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(SNAPSHOT_KEY, null)
            ?: return null
        return runCatching { JSONObject(raw) }.getOrNull()
    }
}
