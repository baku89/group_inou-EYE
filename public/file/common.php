<?

function onError($msg) {

	if (empty($meg)) {
		$msg = "";
	}

	$res = [
		"status" => "ERROR",
		"message" => $msg
	];

	echo json_encode( $res );
	exit();
}

function onSuccess($result) {

	$res = [
		"status" => "OK",
		"result" => $result
	];

	echo json_encode( $res );
	exit();
}
?>