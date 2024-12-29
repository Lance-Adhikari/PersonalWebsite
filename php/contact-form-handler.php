<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com'; // SMTP server
    $mail->SMTPAuth = true;
    $mail->Username = 'your_email@gmail.com'; // SMTP username
    $mail->Password = 'your_password'; // SMTP password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    $mail->setFrom('your_email@gmail.com', 'Your Name');
    $mail->addAddress('lanceatadhikari@gmail.com'); // Recipient

    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body = $body;

    $mail->send();
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    error_log("Mailer Error: {$mail->ErrorInfo}", 3, "error_log.txt");
    echo json_encode(["status" => "error"]);
}


header('Content-Type: application/json');
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize and validate inputs
    $name = htmlspecialchars($_POST['name']);
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $phone = htmlspecialchars($_POST['phone']);
    $message = htmlspecialchars($_POST['message']);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["status" => "invalid_email"]);
        exit;
    }

    if (!preg_match('/^[0-9\-\(\)\/\+\s]*$/', $phone)) {
        echo json_encode(["status" => "invalid_phone"]);
        exit;
    }

    if (empty($name) || empty($message)) {
        echo json_encode(["status" => "empty_fields"]);
        exit;
    }

    // Rate limiting
    if (isset($_SESSION['last_submission_time']) && (time() - $_SESSION['last_submission_time']) < 60) {
        echo json_encode(["status" => "rate_limit"]);
        exit;
    }
    $_SESSION['last_submission_time'] = time();

    // Email settings
    $to = "lanceatadhikari@gmail.com";
    $subject = "New Contact Form Submission";
    $body = nl2br("Name: $name\nEmail: $email\nPhone: $phone\nMessage: $message");
    $headers = "From: $email";

    // Send email
    if (mail($to, $subject, $body, $headers)) {
        echo json_encode(["status" => "success"]);
    } else {
        error_log("Failed to send email: $body", 3, "error_log.txt");
        echo json_encode(["status" => "error"]);
    }
} else {
    echo json_encode(["status" => "invalid_request"]);
}
?>