/**
 * @name bbSelect 
 * @author Harutyun Abgaryan <harutyunabgaryan@gmail.com> 
 */
(function ($) {

    $.fn.bbdropdown = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.dropdown.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exists.');
        }
    };

    var methods = {},

    //Set defauls for the control
    defaults = {
        data: [],
        keepJSONItemsOnTop: false,
        width: 260,
        height: null,
        background: "#eee",
        selectText: "",
        defaultSelectedIndex: null,
        truncateDescription: true,
        imagePosition: "left",
        showSelectedHTML: true,
        clickOffToClose: true,
        selectedShowOnlyImage:false,
        bbSelectedWidth: 300,
        bbSelectOptionWidth: 300,
        onSelected: function () { }
    },

    bbSelectHtml = '<div class="bb-select"><input class="bb-selected-value" type="hidden" /><a class="bb-selected"></a><span class="bb-pointer bb-pointer-down"></span></div>',
    bbOptionsHtml = '<ul class="bb-options"></ul>',

    //CSS for bbdropdown
    bbdropdownCSS = '<style id="css-bbdropdown" type="text/css">' +
                '.bb-select{ border-radius:2px; float:left; border:solid 1px #ccc; position:relative; cursor:pointer;}' +
                '.bb-desc { color:#aaa; display:block; overflow: hidden; font-weight:normal; line-height: 1.4em; }' +
                '.bb-selected{ overflow:hidden; display:block; padding:10px; font-weight:bold;}' +
                '.bb-pointer{ width:0; height:0; position:absolute; right:10px; top:50%; margin-top:-3px;}' +
                '.bb-pointer-down{ border:solid 5px transparent; border-top:solid 5px #000; }' +
                '.bb-pointer-up{border:solid 5px transparent !important; border-bottom:solid 5px #000 !important; margin-top:-8px;}' +
                '.bb-options{ border:solid 1px #ccc; border-top:none; list-style:none; box-shadow:0px 1px 5px #bbd; display:none; position:absolute; z-index:2000; margin:0; padding:0;background:#fff; overflow:auto;}' +
                '.bb-option{ padding:10px; text-align:left; display:block; border-bottom:solid 1px #bbd; overflow:hidden; text-decoration:none; color:#333; cursor:pointer;-webkit-transition: all 0.25s ease-in-out; -moz-transition: all 0.25s ease-in-out;-o-transition: all 0.25s ease-in-out;-ms-transition: all 0.25s ease-in-out; }' +
                '.bb-options > li:last-child > .bb-option{ border-bottom:none;}' +
                '.bb-option:hover{ background:#f3f3f3; color:#000;}' +
                '.bb-selected-description-truncated { text-overflow: ellipsis; white-space:nowrap; }' +
                '.bb-option-selected { background:#f6f6f6; }' +
                '.bb-option-image, .bb-selected-image { vertical-align:mibble; float:left; margin-right:5px; max-width:64px;}' +
                '.bb-image-right { float:right; margin-right:15px; margin-left:5px;}' +
                '.bb-container{ position:relative;}​ .bb-selected-text { font-weight:bold}​</style>';

    if ($('#css-bbdropdown').length <= 0) {
        $(bbdropdownCSS).appendTo('head');
    }

    methods.init = function (options) {
        var options = $.extend({}, defaults, options);

        return this.each(function () {
            var obj = $(this),
                data = obj.data('bbdropdown');
            if (!data) {

                var bbSelect = [], bbJson = options.data;

                obj.find('option').each(function () {
                    var $this = $(this), thisData = $this.data();
                    bbSelect.push({
                        text: $.trim($this.text()),
                        value: $this.val(),
                        selected: $this.is(':selected'),
                        description: thisData.description,
                        imageSrc: thisData.imagesrc
                    });
                });

                //Update Plugin data merging both HTML select data and JSON data for the dropdown
                if (options.keepJSONItemsOnTop)
                    $.merge(options.data, bbSelect);
                else options.data = $.merge(bbSelect, options.data);

                var original = obj, placeholder = $('<div id="' + obj.attr('id') + '"></div>');
                obj.replaceWith(placeholder);
                obj = placeholder;

                obj.addClass('bb-container').append(bbSelectHtml).append(bbOptionsHtml);

                var bbSelect = obj.find('.bb-select'),
                    bbOptions = obj.find('.bb-options');

                bbOptions.css({ width: options.bbSelectOptionWidth });
                bbSelect.css({ width: options.bbSelectWidth, background: options.background });
                obj.css({ width: options.width });

                if (options.height != null)
                    bbOptions.css({ height: options.height, overflow: 'auto' });

                $.each(options.data, function (index, item) {
                    if (item.selected) options.defaultSelectedIndex = index;
                    bbOptions.append('<li>' +
                        '<a class="bb-option">' +
                            (item.value ? ' <input class="bb-option-value" type="hidden" value="' + item.value + '" />' : '') +
                            (item.imageClass ? item.imageClass : item.imageSrc ? ' <img class="bb-option-image' + (options.imagePosition == "right" ? ' bb-image-right' : '') + '" src="' + item.imageSrc + '" />' : '') +
                            (item.text ? ' <label class="bb-option-text">' + item.text + '</label>' : '') +
                            (item.description ? ' <small class="bb-option-description bb-desc">' + item.description + '</small>' : '') +
                        '</a>' +
                    '</li>');
                });

                //Save plugin data.
                var pluginData = {
                    settings: options,
                    original: original,
                    selectedIndex: -1,
                    selectedItem: null,
                    selectedData: null
                }
                obj.data('bbdropdown', pluginData);

                if (options.selectText.length > 0 && options.defaultSelectedIndex == null) {
                    obj.find('.bb-selected').html(options.selectText);
                }
                else {
                    var index = (options.defaultSelectedIndex != null && options.defaultSelectedIndex >= 0 && options.defaultSelectedIndex < options.data.length)
                                ? options.defaultSelectedIndex
                                : 0;
                    selectIndex(obj, index);
                }

                obj.find('.bb-select').on('click.bbdropdown', function () {
                    open(obj);
                });

                obj.find('.bb-option').on('click.bbdropdown', function () {
                    selectIndex(obj, $(this).closest('li').index());
                });

                if (options.clickOffToClose) {
                    bbOptions.addClass('bb-click-off-close');
                    obj.on('click.bbdropdown', function (e) { e.stopPropagation(); });
                    $('body').on('click', function () {
                        $('.bb-click-off-close').slideUp(50).siblings('.bb-select').find('.bb-pointer').removeClass('bb-pointer-up');
                    });
                }
            }
        });
    };

    methods.select = function (options) {
        return this.each(function () {
            if (options.index)
                selectIndex($(this), options.index);
        });
    }

    methods.open = function () {
        return this.each(function () {
            var $this = $(this),
                pluginData = $this.data('bbdropdown');

            if (pluginData)
                open($this);
        });
    };

    methods.close = function () {
        return this.each(function () {
            var $this = $(this),
                pluginData = $this.data('bbdropdown');

            if (pluginData)
                close($this);
        });
    };

    methods.destroy = function () {
        return this.each(function () {
            var $this = $(this),
                pluginData = $this.data('bbdropdown');

            if (pluginData) {
                var originalElement = pluginData.original;
                $this.removeData('bbdropdown').unbind('.bbdropdown').replaceWith(originalElement);
            }
        });
    }

    function selectIndex(obj, index) {

        var pluginData = obj.data('bbdropdown');

        var bbSelected = obj.find('.bb-selected'),
            bbSelectedValue = bbSelected.siblings('.bb-selected-value'),
            bbOptions = obj.find('.bb-options'),
            bbPointer = bbSelected.siblings('.bb-pointer'),
            selectedOption = obj.find('.bb-option').eq(index),
            selectedLiItem = selectedOption.closest('li'),
            settings = pluginData.settings,
            selectedData = pluginData.settings.data[index];

        obj.find('.bb-option').removeClass('bb-option-selected');
        selectedOption.addClass('bb-option-selected');

        pluginData.selectedIndex = index;
        pluginData.selectedItem = selectedLiItem;
        pluginData.selectedData = selectedData;        

        if (settings.showSelectedHTML) {
            if (settings.selectedShowOnlyImage){
                bbSelected.html(
                    (selectedData.selectedImage ? selectedData.selectedImage : selectedData.imageSrc ? '<img class="bb-selected-image' + (settings.imagePosition == "right" ? ' bb-image-right' : '') + '" src="' + selectedData.imageSrc + '" />' : '')
                );
            }else{
                bbSelected.html(
                    (selectedData.selectedImage ?  selectedData.selectedImage : selectedData.imageSrc ? '<img class="bb-selected-image' + (settings.imagePosition == "right" ? ' bb-image-right' : '') + '" src="' + selectedData.imageSrc + '" />' : '') +
                    (selectedData.text ? '<label class="bb-selected-text">' + selectedData.text + '</label>' : '') +
                    (selectedData.description ? '<small class="bb-selected-description bb-desc' + (settings.truncateDescription ? ' bb-selected-description-truncated' : '') + '" >' + selectedData.description + '</small>' : '')
                );
            }


        }
        else bbSelected.html(selectedData.text);


        bbSelectedValue.val(selectedData.value);

        pluginData.original.val(selectedData.value);
        obj.data('bbdropdown', pluginData);

        close(obj);

        //Adjust appearence for selected option
        adjustSelectedHeight(obj);

        if (typeof settings.onSelected == 'function') {
            settings.onSelected.call(this, pluginData);
        }
    }

    function open(obj) {

        var $this = obj.find('.bb-select'),
            bbOptions = $this.siblings('.bb-options'),
            bbPointer = $this.find('.bb-pointer'),
            wasOpen = bbOptions.is(':visible');

        $('.bb-click-off-close').not(bbOptions).slideUp(50);
        $('.bb-pointer').removeClass('bb-pointer-up');

        if (wasOpen) {
            bbOptions.slideUp('fast');
            bbPointer.removeClass('bb-pointer-up');
        }
        else {
            bbOptions.slideDown('fast');
            bbPointer.addClass('bb-pointer-up');
        }

        adjustOptionsHeight(obj);
    }

    function close(obj) {
        obj.find('.bb-options').slideUp(50);
        obj.find('.bb-pointer').removeClass('bb-pointer-up').removeClass('bb-pointer-up');
    }

    function adjustSelectedHeight(obj) {

        var lSHeight = obj.find('.bb-select').css('height');

        var descriptionSelected = obj.find('.bb-selected-description');
        var imgSelected = obj.find('.bb-selected-image');
        if (descriptionSelected.length <= 0 && imgSelected.length > 0) {
            obj.find('.bb-selected-text').css('lineHeight', lSHeight);
        }
    }

    function adjustOptionsHeight(obj) {
        obj.find('.bb-option').each(function () {
            var $this = $(this);
            var lOHeight = $this.css('height');
            var descriptionOption = $this.find('.bb-option-description');
            var imgOption = obj.find('.bb-option-image');
            if (descriptionOption.length <= 0 && imgOption.length > 0) {
                $this.find('.bb-option-text').css('lineHeight', lOHeight);
            }
        });
    }

})(jQuery);