function getURLParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

document.addEventListener("DOMContentLoaded", () => {
    const url = getURLParameter("url");

    if (url) {
        // Security: Prevent embedding non-HTTPS or chrome-extension pages
        if (url.startsWith("http://") || url.startsWith("https://")) {
            document.getElementById("embeddedFrame").src = url;
        } else {
            alert("Invalid URL");
        }
    } else {
        alert("No URL provided");
    }
});
