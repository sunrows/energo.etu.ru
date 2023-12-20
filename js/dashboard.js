function showContent(contentId) {
    // Скрыть все разделы контента
    $(".content").hide();
    
    // Показать выбранный раздел контента
    $("#" + contentId).show();
}

// для раскрывающегося списка флажков
$(".checkbox-menu").on("change", "input[type='checkbox']", function() {
    $(this).closest("li").toggleClass("active", this.checked);
 });
 
 $('.allow-focus').on('click', function(e) { e.stopPropagation(); });
 
 // для подсказки
 $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })