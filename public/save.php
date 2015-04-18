<?
// http://icondecotter.jp/blog/2013/01/31/canvas-todataurl%E3%83%A1%E3%82%BD%E3%83%83%E3%83%89%E3%82%92%E4%BD%BF%E3%81%86/

try {

	$canvas = $_POST["image"];
	$canvas = preg_replace("/data:image\/png;base64,/i","",$canvas);

	$buffer = base64_decode($canvas);

	$image = imagecreatefromstring($buffer);

	$filename = $_POST["name"] . str_pad($_POST["number"], 6, "0", STR_PAD_LEFT) . ".png";
	$dir = $_POST["directory"] . "/" . $_POST["name"];

	if (!file_exists($dir)) {
    mkdir($dir, 0777, true);
}

	imagepng($image, $dir . "/" . $filename);
	imagedestroy( $image );

} catch (Exception $e) {
	?>{"status": "failed", "message": <?= $e->getMessage() ?>}<?
	exit();
}

?>
{"status": "success"}