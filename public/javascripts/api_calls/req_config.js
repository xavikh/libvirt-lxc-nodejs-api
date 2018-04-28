const host = "http://192.168.0.10:3000";

function request(method, path, auth, data, next) {
    let req_params = {
        "async": true,
        "crossDomain": true,
        "url": host + path,
        "method": method,
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
            "Authorization": (!auth) ? undefined : 'Bearer ' + auth
        },
        "data": data
    };

    $.ajax(req_params).done(function (response) {
        next(response)
    }).fail(function (xhr, textStatus, errorThrown) {
        let err = {
            code: xhr.status,
            res: JSON.parse(xhr.responseText),
            message: textStatus,
            error: errorThrown
        };
        M.toast({html: err.res.message, classes: "red"});
    });
}

