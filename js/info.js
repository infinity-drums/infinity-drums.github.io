
// const slideStep = new Swiper('.slideStep', {
//     slidesPerView: 1.7,
//     spaceBetween: 10,
//     pagination: {
//         el: '.swiper-pagination',
//     },
//     breakpoints: {
//         480: {
//             slidesPerView: 2,
//         },
//         768: {
//             slidesPerView: 3,
//         },
//         1200: {
//             slidesPerView: 4,
//             spaceBetween: 24,
//         }
//     }
// });
// AOS.init({
//     easing: 'ease-out-back',
//     duration: 1000
// });


$(document).ready(function () {
    $(document).on("keydown", function (event) {
        let key = event.code;
        console.log(key);
        $(`[data-key="${key}"]`)[0].play();
    });
});
