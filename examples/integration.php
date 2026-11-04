<?php
// These values would normally come from your own trusted configuration.
$videoId = 'HuACikeyg0c';
$label = 'Watch our video';
function gv_escape($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>gennix-video · PHP integration</title>
<link rel="stylesheet" href="../src/gennix-video.css">
<script src="../src/gennix-video.js" defer></script>
</head>
<body>
<h1>PHP integration</h1>
<p>Escape every dynamic HTML attribute. This example reads no cookies and writes none.</p>
<gennix-video size="fullwidth" aspect-ratio="16/9" max-height="80dvh"
  background="poster" provider="youtube"
  src="<?= gv_escape($videoId) ?>" playlabel="<?= gv_escape($label) ?>">
</gennix-video>
<p><a href="index.html">Configuration guide</a></p>
</body>
</html>
