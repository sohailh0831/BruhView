var DatatableJsonRemoteDemo = {

    init: function() {
        var t, e;

        var fullurl = window.location.pathname;
        var spliturl = fullurl.split("/");
        var part = spliturl[2];

        t = $(".m_datatable").mDatatable({
            data: {
                type: "remote",
                source: {
                  read: {
                    url: `/categories/get-user-reviews/${part}`,
                    method: 'POST'
                  },
                },
            },
            layout: {
                theme: "default",
                class: "",
                scroll: !1,
                footer: !1
            },
            sortable: !0,
            pagination: !0,
            search: {
                input: $("#generalSearch")
            },
            columns: [{
                field: "username",
                title: "Username",
                width: 100,
            }, {
                field: "review",
                title: "Review",
                width: 800,
            }]
        })
    }
};
jQuery(document).ready(function() {
    DatatableJsonRemoteDemo.init()
});
