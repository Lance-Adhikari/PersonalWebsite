// Initialize EmailJS
emailjs.init("IJCXLixuCTjT9yGdK");

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("contactForm");

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission

        // Collect form data
        const formData = {
            from_name: document.getElementById("name").value, // Full Name
            from_email: document.getElementById("email").value, // Email Address
            phone: document.getElementById("phone").value, // Phone Number
            message: document.getElementById("message").value, // Message
        };

        // Send form data via EmailJS
        emailjs
            .send("service_jna96wk", "template_fh7r1tb", formData)
            .then(() => {
                alert("Message sent successfully!");
                form.reset(); // Clear the form fields
            })
            .catch((error) => {
                console.error("EmailJS error:", error);
                alert("Failed to send the message. Please try again later.");
            });
    });
});