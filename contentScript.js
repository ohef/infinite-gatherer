if( process.env.NODE_ENV !== 'production' ){
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "http://127.0.0.1:8080/bundle.js";
    document.body.append(s)
}