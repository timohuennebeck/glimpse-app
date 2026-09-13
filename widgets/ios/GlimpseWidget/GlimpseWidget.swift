import WidgetKit
import SwiftUI

// The Glimpse homescreen widget.
//
// This is the product's front door: a friend's photo, frosted, with their name
// on it. Tapping it deep-links straight into the camera — never into the photo.
//
// The widget has no network access and no JS runtime, so it renders a snapshot
// the app writes into the shared App Group container.

private let appGroup = "group.app.glimpse.mobile"
private let snapshotKey = "glimpse.widget.snapshot"

struct MomentSnapshot: Codable {
    struct Moment: Codable {
        let tradeId: String
        let fromName: String
        let caption: String?
        let capturedAt: String
        let imageFile: String
        let locked: Bool
    }
    let moment: Moment?
    let updatedAt: String
}

struct GlimpseEntry: TimelineEntry {
    let date: Date
    let snapshot: MomentSnapshot?
    let image: UIImage?
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> GlimpseEntry {
        GlimpseEntry(date: Date(), snapshot: nil, image: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (GlimpseEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GlimpseEntry>) -> Void) {
        // The app calls WidgetCenter.reloadAllTimelines() whenever the inbox
        // changes, so this refresh interval is only a safety net.
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [loadEntry()], policy: .after(next)))
    }

    private func loadEntry() -> GlimpseEntry {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let json = defaults.string(forKey: snapshotKey),
            let data = json.data(using: .utf8),
            let snapshot = try? JSONDecoder().decode(MomentSnapshot.self, from: data)
        else {
            return GlimpseEntry(date: Date(), snapshot: nil, image: nil)
        }

        var image: UIImage?
        if let file = snapshot.moment?.imageFile,
           let container = FileManager.default.containerURL(
               forSecurityApplicationGroupIdentifier: appGroup
           ) {
            image = UIImage(contentsOfFile: container.appendingPathComponent(file).path)
        }

        return GlimpseEntry(date: Date(), snapshot: snapshot, image: image)
    }
}

struct GlimpseWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    var entry: GlimpseEntry

    var body: some View {
        if let moment = entry.snapshot?.moment {
            // Deep link into the camera, not the photo. The rule holds here too.
            Link(destination: URL(string: "glimpse://camera?trade=\(moment.tradeId)")!) {
                content(for: moment)
            }
        } else {
            EmptyStateView()
        }
    }

    @ViewBuilder
    private func content(for moment: MomentSnapshot.Moment) -> some View {
        switch family {
        case .systemLarge, .systemMedium:
            MediumWidgetView(moment: moment, image: entry.image)
        default:
            SmallWidgetView(moment: moment, image: entry.image)
        }
    }
}

/// 2x2: the frosted photo fills the tile, sender and camera button overlaid.
struct SmallWidgetView: View {
    let moment: MomentSnapshot.Moment
    let image: UIImage?

    var body: some View {
        ZStack(alignment: .bottom) {
            FrostedPhoto(image: image, locked: moment.locked, blur: 8)

            LinearGradient(
                colors: [.clear, .black.opacity(0.78)],
                startPoint: .init(x: 0.5, y: 0.38),
                endPoint: .bottom
            )

            if moment.locked {
                LockPuck(size: 44)
                    .offset(y: -28)
            }

            HStack(alignment: .bottom, spacing: 7) {
                VStack(alignment: .leading, spacing: 1) {
                    Text(moment.fromName)
                        .font(.system(size: 9))
                        .foregroundStyle(.white.opacity(0.75))
                    if let caption = moment.caption {
                        Text(caption)
                            .font(.system(size: 11))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                    }
                }
                Spacer(minLength: 0)
                CameraBadge(size: 27)
            }
            .padding(.horizontal, 9)
            .padding(.bottom, 8)
        }
    }
}

/// 4x2: frosted photo on the left, sender and a reply button on the right.
struct MediumWidgetView: View {
    let moment: MomentSnapshot.Moment
    let image: UIImage?

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                FrostedPhoto(image: image, locked: moment.locked, blur: 10)
                if moment.locked { LockPuck(size: 40) }
            }
            .frame(width: 118)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text(moment.fromName)
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundStyle(.white)

                if let caption = moment.caption {
                    Text(caption)
                        .font(.system(size: 13))
                        .foregroundStyle(.white.opacity(0.94))
                        .lineLimit(3)
                }

                Spacer(minLength: 0)

                HStack(spacing: 7) {
                    Image(systemName: "camera.fill").font(.system(size: 13))
                    Text("Antworten").font(.system(size: 13, weight: .semibold))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 34)
                .background(Color(red: 0.545, green: 0.361, blue: 0.965)) // #8B5CF6
                .clipShape(Capsule())
            }
        }
        .padding(11)
    }
}

struct FrostedPhoto: View {
    let image: UIImage?
    let locked: Bool
    let blur: CGFloat

    var body: some View {
        GeometryReader { geo in
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: geo.size.width, height: geo.size.height)
                    // NOTE: presentation only. The image written to the shared
                    // container is already the server's blurred rendition when
                    // the trade is locked, so the original never reaches the
                    // device before the trade completes.
                    .blur(radius: locked ? blur : 0, opaque: true)
                    .clipped()
            } else {
                Color(red: 0.09, green: 0.07, blue: 0.11)
            }
        }
    }
}

struct LockPuck: View {
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle().fill(.ultraThinMaterial)
            Circle().stroke(.white.opacity(0.3), lineWidth: 1)
            Image(systemName: "pause.fill")
                .font(.system(size: size * 0.39))
                .foregroundStyle(.white)
        }
        .frame(width: size, height: size)
    }
}

struct CameraBadge: View {
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle().fill(Color(red: 0.545, green: 0.361, blue: 0.965))
            Image(systemName: "camera.fill")
                .font(.system(size: size * 0.44))
                .foregroundStyle(.white)
        }
        .frame(width: size, height: size)
    }
}

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "camera.fill")
                .font(.system(size: 22))
                .foregroundStyle(.white.opacity(0.6))
            Text("Schick den ersten Moment")
                .font(.system(size: 12))
                .multilineTextAlignment(.center)
                .foregroundStyle(.white.opacity(0.8))
        }
        .padding(12)
    }
}

@main
struct GlimpseWidget: Widget {
    let kind = "GlimpseWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            GlimpseWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    Color(red: 0.09, green: 0.07, blue: 0.11)
                }
        }
        .configurationDisplayName("Glimpse")
        .description("Der verschwommene Moment, bis du zurücktauschst.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
