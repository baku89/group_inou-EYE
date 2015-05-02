<?
require_once("./common.php");

if (empty($_POST["path"]) || empty($_POST["text"])) {
	onError();
}

$path = "../" . $_POST["path"];
$data = $_POST["text"];

$result = file_put_contents($path, $data);

if ($result === FALSE) {
	onError();
} else {
	$res = [
		"bytes" => $result
	];
	onSuccess($res);
}
?>