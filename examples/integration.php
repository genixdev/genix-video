<?php
// These values would normally come from your own trusted configuration.
$videoId = 'h5D-Meb4u7g';
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
<title>genix-video · PHP integration | genixdev</title>
<link rel="stylesheet" href="../src/genix-video.css?v=1.0.1">
<script src="../src/genix-video.js?v=1.0.1" defer></script>
<meta name="description" content="Integrate genix-video into PHP websites with escaped HTML attributes and simple configuration.">
<meta name="author" content="genixdev">
<link rel="canonical" href="https://genix-video.genixdev.com/examples/integration.php">
<link rel="icon" href="assets/favicon.ico" sizes="any">
<meta property="og:type" content="website">
<meta property="og:site_name" content="genix-video by genixdev">
<meta property="og:title" content="genix-video · PHP integration | genixdev">
<meta property="og:description" content="Integrate genix-video into PHP websites with escaped HTML attributes and simple configuration.">
<meta property="og:url" content="https://genix-video.genixdev.com/examples/integration.php">
<meta property="og:image" content="https://genix-video.genixdev.com/examples/assets/genixdev.png">
<meta property="og:image:alt" content="genixdev logo">
<meta name="twitter:card" content="summary">
</head>
<body>
<h1>PHP integration</h1>
<p>Escape every dynamic HTML attribute. This example reads no cookies and writes none.</p>
<genix-video size="fullwidth" aspect-ratio="16/9" max-height="80dvh"
  background="poster" provider="youtube"
  src="<?= gv_escape($videoId) ?>" playlabel="<?= gv_escape($label) ?>">
</genix-video>
<p><a href="index.html">Configuration guide</a></p>
<footer><a href="../LICENSE">MIT license</a> · <a href="assets/README.md">Media credits</a><p class="gv-demo-contact">Need a video integration or a custom website? <a href="https://genixdev.com/">Work with genixdev</a>.</p><a href="https://genixdev.com/">Built by genixdev</a><a href="https://github.com/genixdev/genix-video">View on GitHub</a></footer></body>
</html>
