window.open = function(url, target, windowFeatures) {
    if(location.host != new URL(url).host && target == '_blank'){
        opd_system.open_default_browser(url);
    }
};
document.addEventListener('click', (event) => {
    const target = event.target.closest('a');
    console.log(target)
    const misskey_img_link_filter = target?.querySelector("canvas[title]") == undefined;
    if(target && target.href && misskey_img_link_filter){
        event.preventDefault();
        if(location.host != new URL(target.href).host){
            opd_system.open_default_browser(target.href);
        }
    }
});
document.addEventListener('auxclick', (event) => {
    const target = event.target.closest('a');
    const misskey_img_link_filter = target?.querySelector("canvas[title]") == undefined;
    if(target && target.href && misskey_img_link_filter){
        event.preventDefault();
        if(location.host != new URL(target.href).host){
            opd_system.open_default_browser(target.href);
        }
    }
})
window.addEventListener("load", function(){
    document.querySelector("#ext_version").textContent = opd_system.opd_version();
    document.querySelector(".opd_logo").style.backgroundImage = `url(${opd_system.load_resource("icon/logo_icon.svg")})`;
    document.querySelector(".opd_logo_text").style.backgroundImage = `url(${opd_system.load_resource("icon/t_logo.svg")})`;
    let change_img_mode = 0;
    document.querySelector(".opd_logo").addEventListener("click", function(){
        if(change_img_mode == 0){
            document.querySelector(".opd_logo").style.backgroundImage = `url(${opd_system.load_resource("icon/logo_v1.svg")})`;
            change_img_mode = 1;
        }else{
            document.querySelector(".opd_logo").style.backgroundImage = `url(${opd_system.load_resource("icon/logo_icon.svg")})`;
            change_img_mode = 0;
        }
    });
    document.getElementById("open_license_dir").addEventListener("click", function(){
        opd_system.open_license_browser();
    })
});