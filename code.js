/* global Promise, fetch, window, cytoscape, document, tippy, _ */

Promise.all([
    fetch('cy-style.json')
        .then(function (res) {
            return res.json();
        }),
    fetch('data.json')
        .then(function (res) {
            return res.json();
        })
])
    .then(function (dataArray) {
        var h = function (tag, attrs, children) {
            var el = document.createElement(tag);

            Object.keys(attrs).forEach(function (key) {
                var val = attrs[key];

                el.setAttribute(key, val);
            });

            children.forEach(function (child) {
                el.appendChild(child);
            });

            return el;
        };

        var t = function (text) {
            var el = document.createTextNode(text);

            return el;
        };

        var $ = document.querySelector.bind(document);

        var cy = window.cy = cytoscape({
            container: document.getElementById('cy'),
            style: dataArray[0],
            elements: dataArray[1],
            layout: { name: 'random' }
        });

        cy.nodes().filter(function (ele) {
            return ele.data('private') == true && ele.data('id') != "pawel"
        }).style({
            "background-color": "#BDA523",
            "color": "#555",
            "text-outline-color": "#fff",
            "text-outline-width": "2px",
        })

        cy.style().selector('#pawel')
            .css({
                'background-image': 'profile.jpg',
                'background-fit': 'contain',
                'text-valign': 'bottom'
            })

        var params = {
            name: 'cola',
            nodeSpacing: 5,
            edgeLengthVal: 105,
            animate: true,
            randomize: false,
            maxSimulationTime: 1500
        };
        var layout = makeLayout();

        layout.run();

        var $btnParam = h('div', {
            'class': 'param'
        }, []);

        var $config = $('#config');

        $btnParam.appendChild(h('label', {'class': 'label-reload'}, [t("Reload")]))

        $config.appendChild($btnParam);

        var sliders = [
            {
                label: 'Edge length',
                param: 'edgeLengthVal',
                min: 1,
                max: 200
            }
            // ,
            // {
            //     label: 'Knowledge',
            //     param: 'knowledge',
            //     min: 1,
            //     max: 8,
            //     value: 1
            // },
        ];

        var buttons = [
            {
                label: h('span', { 'class': 'fa fa-refresh' }, []),
                layoutOpts: {
                    randomize: true,
                    flow: null
                }
            }
        ];

        sliders.forEach(makeSlider);

        buttons.forEach(makeButton);

        function makeLayout(opts) {
            params.randomize = false;
            params.edgeLength = function (e) { return params.edgeLengthVal / e.data('weight') + 35; };

            for (var i in opts) {
                params[i] = opts[i];
            }

            return cy.layout(params);
        }

        function makeSlider(opts) {
            var $input = h('input', {
                id: 'slider-' + opts.param,
                type: 'range',
                min: opts.min,
                max: opts.max,
                step: 1,
                value: params[opts.param],
                'class': 'slider'
            }, []);

            var $param = h('div', { 'class': 'param' }, []);

            var $label = h('label', { 'class': 'label label-default', for: 'slider-' + opts.param }, [t(opts.label)]);

            $param.appendChild($label);
            $param.appendChild($input);

            $config.appendChild($param);

            var update = _.throttle(function () {

                // if ($input.id == 'slider-knowledge') {
                //     console.log($input.value)
                //     cy.edges().filter(function (ele) {
                //         console.log(ele.data('score'))
                //         console.log(ele.data('label') == 'knows' && ele.data('score') < $input.value)
                //         return ele.data('label') == 'knows' && ele.data('score') < $input.value;
                //     }).style({
                //         'display': 'none'
                //     })

                //     cy.edges().filter(function (ele) {
                //         console.log(ele.data('score'))
                //         console.log(ele.data('label') == 'knows' && ele.data('score') > $input.value)
                //         return ele.data('label') == 'knows' && ele.data('score') < $input.value;
                //     }).style({
                //         'display': 'element'
                //     })

                // }

                params[opts.param] = $input.value;

                layout.stop();
                layout = makeLayout();
                layout.run();

            }, 1000 / 30);

            $input.addEventListener('input', update);
            $input.addEventListener('change', update);
        }

        function makeButton(opts) {
            var $button = h('button', { 'class': 'btn btn-warning' }, [opts.label]);

            $btnParam.appendChild($button);

            $button.addEventListener('click', function () {
                layout.stop();

                if (opts.fn) { opts.fn(); }

                layout = makeLayout(opts.layoutOpts);
                layout.run();
            });
        }

        var makeTippy = function (node, html) {
            return tippy(node.popperRef(), {
                html: html,
                trigger: 'manual',
                arrow: true,
                placement: 'bottom',
                hideOnClick: false,
                interactive: true
            }).tooltips[0];
        };

        var hideTippy = function (node) {
            var tippy = node.data('tippy');

            if (tippy != null) {
                tippy.hide();
            }
        };

        var hideAllTippies = function () {
            cy.nodes().forEach(hideTippy);
        };

        cy.on('tap', function (e) {
            if (e.target === cy) {
                hideAllTippies();
            }
        });

        cy.on('tap', 'edge', function (e) {
            hideAllTippies();
        });

        cy.on('zoom pan', function (e) {
            hideAllTippies();
        });

        cy.nodes().forEach(function (n) {
            var g = n.data('name');

            // var $links = [
            //     {
            //         name: 'GeneCard',
            //         url: 'http://www.genecards.org/cgi-bin/carddisp.pl?gene=' + g
            //     },
            //     {
            //         name: 'UniProt search',
            //         url: 'http://www.uniprot.org/uniprot/?query=' + g + '&fil=organism%3A%22Homo+sapiens+%28Human%29+%5B9606%5D%22&sort=score'
            //     },
            //     {
            //         name: 'GeneMANIA',
            //         url: 'http://genemania.org/search/human/' + g
            //     }
            // ].map(function (link) {
            //     return h('a', { target: '_blank', href: link.url, 'class': 'tip-link' }, [t(link.name)]);
            // });

            var tippy = makeTippy(n, h('div', {}, $links));

            n.data('tippy', tippy);

            n.on('click', function (e) {
                tippy.show();

                cy.nodes().not(n).forEach(hideTippy);
            });
        });

        $('#config-toggle').addEventListener('click', function () {
            $('body').classList.toggle('config-closed');

            cy.resize();
        });


        $('#privs').addEventListener('click', function () {
           
            cy.nodes().filter(function (ele) {
                return ele.data('private') == false;
            }).style({
                'display': this.checked ? 'none' : 'element'
            })
        });

        $('#pros').addEventListener('click', function () {
            cy.nodes().filter(function (ele) {
                return ele.data('private') != false && ele.data("id") != 'pawel'
            }).style({
                'display': this.checked ? 'none' : 'element'
            })
        });

    });
