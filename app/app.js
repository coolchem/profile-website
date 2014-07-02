

$r.package("app").skins(

        {skinClass:'AppSkin', skinURL:"appSkin.html"},
        {skinClass:'SectionSkin', skinURL:"views/sectionSkin.html"}
)

//skin states supported are
// "home" "mywork" "resume"
$r.Application("profileWebsite", function(){


    //binding functions so the have this as context
    var handleMenuItemClicked = this.bind(handleMenuItemClickedFn);



    this.init = function(){

        this.super.init();
        this.skinClass = "app.AppSkin";
        this.currentState = getStateFromHash(location.hash);

    }

    this.initialize = function(){
        this.super.initialize();
        window.onhashchange = this.bind(locationHashChanged, this);

    }

    //links
    this.aboutMeLink = null;
    this.myWorkLink = null;
    this.myResumeLink = null;

    this.homeSection = null;
    this.portfolioSection = null;
    this.resumeSection = null;

    this.skinParts = [{id:"aboutMeLink", required:true},
        {id:"myWorkLink", required:true},
        {id:"myResumeLink", required:true},

        {id:"homeSection", required:true},
        {id:"portfolioSection", required:true},
        {id:"resumeSection", required:true}];

    this.partAdded = function(partName, instance){
        this.super.partAdded(partName,instance)

        if(instance === this.aboutMeLink || instance === this.myWorkLink || instance === this.myResumeLink)
            instance.addEventListener("click", handleMenuItemClicked);

    }


    function handleMenuItemClickedFn(event){

        if(event.target === this.aboutMeLink[0])
        {
            location.hash = "#aboutme";
            this.currentState = "home";

        }
        else if(event.target === this.myWorkLink[0])
        {
            location.hash = "#mywork";
            this.currentState = "mywork";
        }
        else
        {
            location.hash = "#resume";
            this.currentState = "resume";
        }
    }

    function locationHashChanged() {

        console.log("humm  how many times do i get called");
    }


    function getStateFromHash(hash){
        switch (hash) {
            case '#aboutme':
            {
                return "home";
            }

            case "#mywork":
            {
                return "mywork";
            }

            case "#myresume":
            {

                return "resume";
            }
            default:
            {
                window.location.hash = "#aboutme"
                return "home"
            }
        }

    }


})