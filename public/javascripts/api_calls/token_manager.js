
function saveToken(token, persistance) {
    if(persistance)
        localStorage.setItem("token", token);
    else
        sessionStorage.setItem("token", token);
}

function getToken() {
    if(!sessionStorage.getItem("token")){
        return localStorage.getItem("token");
    } else {
        return sessionStorage.getItem("token");
    }
}

function cleanToken() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
}
