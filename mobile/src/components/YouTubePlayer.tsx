import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { colors, spacing, fontSize } from "../theme";

interface Props {
  videoId: string;
  videoUrl: string;
}

export default function YouTubePlayerComponent({ videoId, videoUrl }: Props) {
  const [loading, setLoading] = useState(true);

  const onReady = useCallback(() => setLoading(false), []);

  const handleOpenYouTube = useCallback(() => {
    Linking.openURL(videoUrl).catch(() =>
      Alert.alert("Error", "Could not open YouTube")
    );
  }, [videoUrl]);

  return (
    <View>
      {loading && (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      )}
      <YoutubePlayer
        height={220}
        videoId={videoId}
        onReady={onReady}
        webViewProps={{ allowsInlineMediaPlayback: true }}
      />
      <TouchableOpacity style={styles.ytButton} onPress={handleOpenYouTube}>
        <Text style={styles.ytButtonText}>Watch on YouTube</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { position: "absolute", top: 90, alignSelf: "center", zIndex: 1 },
  ytButton: {
    backgroundColor: "#FF0000",
    paddingVertical: spacing.sm + 2,
    borderRadius: 8,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  ytButtonText: { color: "#fff", fontSize: fontSize.md, fontWeight: "600" },
});
