<?
require_once("./common.php");

if (empty($_GET["path"])) {
	onError();
}

$path = "../" . $_GET["path"];

$result = file_exists($path);

onSuccess($result);
?>