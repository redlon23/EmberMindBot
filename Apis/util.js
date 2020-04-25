
function KeyValue(key, value) {
    this.key = key;
    this.value = value;
}

KeyValue.prototype = {
    toString: function () {
        return encodeURIComponent(this.key) + '=' + encodeURIComponent(this.value);
    }
};

function sortParamsAlphabetically(requestParams) {
    var query = [];
    for (var key in requestParams) {
        if (requestParams.hasOwnProperty(key)) {
            query.push(new KeyValue(key, requestParams[key]));
        }
    }
    query.sort(function (a, b) {
        return a.key < b.key ? -1 : 1
    });
    return query.join('&');
}

module.exports = {
    sortParamsAlphabetically
}