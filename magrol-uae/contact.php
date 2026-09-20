<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = strip_tags(trim($_POST["name"] ?? ""));
    $email = filter_var(trim($_POST["email"] ?? ""), FILTER_SANITIZE_EMAIL);
    $phone = strip_tags(trim($_POST["phone"] ?? ""));
    $interest = strip_tags(trim($_POST["interest"] ?? ""));
    $detail = strip_tags(trim($_POST["detail"] ?? ""));
    $ref = strip_tags(trim($_POST["ref"] ?? ""));

    if (empty($name) || empty($email) || empty($interest) || empty($detail)) {
        http_response_code(400);
        echo "Please fill in all required fields.";
        exit;
    }

    $recipient = "uae@magrolglobal.com";
    $subject = "New Enquiry [$ref] from $name - $interest";
    
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n";
    $email_content .= "Phone: $phone\n\n";
    $email_content .= "Interest: $interest\n\n";
    $email_content .= "Details:\n$detail\n\n";
    $email_content .= "Reference: $ref\n";

    $email_headers = "From: $name <$email>";

    if (mail($recipient, $subject, $email_content, $email_headers)) {
        http_response_code(200);
        echo "Thank You! Your message has been sent.";
    } else {
        http_response_code(500);
        echo "Oops! Something went wrong and we couldn't send your message.";
    }
} else {
    http_response_code(403);
    echo "There was a problem with your submission, please try again.";
}
?>
