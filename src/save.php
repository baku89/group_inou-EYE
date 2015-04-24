<?
try {

	$canvas = $_POST["image"];
	$canvas = preg_replace("/data:image\/png;base64,/i","",$canvas);

	$buffer = base64_decode($canvas);

	$image = imagecreatefromstring($buffer);

	$filename = $_POST["name"] ."_". str_pad($_POST["number"], 6, "0", STR_PAD_LEFT) . ".png";
	$dir = $_POST["directory"] . "/" . $_POST["name"];

	if (!file_exists($dir)) {
    mkdir($dir, 0777, true);
}

	imagepng($image, $dir . "/" . $filename);
	imagedestroy( $image );

} catch (Exception $e) {
	onError( $e->getMessage() );
}

?>
{"status": "success"}