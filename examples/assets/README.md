# Local native samples

These generated test charts contain no third-party source footage. The white border helps detect cropping. All samples are silent H.264 videos with a fast-start MP4 container and a JPEG poster taken from the first frame.

- sample.mp4: 1280 × 720, 12 seconds.
- portrait.mp4: 360 × 640, 6 seconds.
- square.mp4: 640 × 640, 6 seconds.

To regenerate, install FFmpeg and run the following commands from this directory. FFmpeg is an authoring tool, not a runtime dependency.

```sh
ffmpeg -f lavfi -i "testsrc2=size=360x640:rate=24" -t 6 -vf "drawbox=x=8:y=8:w=iw-16:h=ih-16:color=white:t=4" -c:v libx264 -preset medium -crf 28 -pix_fmt yuv420p -movflags +faststart -an portrait.mp4
ffmpeg -i portrait.mp4 -frames:v 1 -q:v 2 portrait-poster.jpg
ffmpeg -f lavfi -i "testsrc2=size=640x640:rate=24" -t 6 -vf "drawbox=x=8:y=8:w=iw-16:h=ih-16:color=white:t=4" -c:v libx264 -preset medium -crf 28 -pix_fmt yuv420p -movflags +faststart -an square.mp4
ffmpeg -i square.mp4 -frames:v 1 -q:v 2 square-poster.jpg
ffmpeg -f lavfi -i "testsrc2=size=1280x720:rate=24" -t 12 -vf "drawbox=x=12:y=12:w=iw-24:h=ih-24:color=white:t=6" -c:v libx264 -preset medium -crf 28 -pix_fmt yuv420p -movflags +faststart -an sample.mp4
ffmpeg -i sample.mp4 -frames:v 1 -q:v 2 sample-poster.jpg
```

The YouTube demo is embedded remotely; its video and thumbnail are not included as owned assets. Third-party rights remain with their respective holders.
