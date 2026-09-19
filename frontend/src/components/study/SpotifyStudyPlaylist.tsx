import { motion } from "framer-motion";
function SpotifyStudyPlaylist() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="
w-[250px]
        rounded-[2rem]
        overflow-hidden
        border border-white/60
        bg-white/50
        shadow-[0_24px_70px_-20px_rgba(224,112,158,0.35)]
        backdrop-blur-xl
        p-4
      "
        >
            <div className="mb-3 text-center">
                <h3 className="font-display text-lg font-semibold text-ink">
                    🎧 Study Playlist
                </h3>

                <p className="font-body text-xs text-ink/60">
                    Focus music while you study ♡
                </p>
            </div>

            <iframe
                src="https://open.spotify.com/embed/playlist/0oPyDVNdgcPFAWmOYSK7O1?utm_source=generator"
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl"
            />
        </motion.div>
    )
}

export default SpotifyStudyPlaylist