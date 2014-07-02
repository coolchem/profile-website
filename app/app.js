

$r.package("app").skins(

        {skinClass:'AppSkin', skinURL:"appSkin.html"},
        {skinClass:'SectionSkin', skinURL:"views/sectionSkin.html"}
)

//skin states supported are
// "home" "mywork" "resume"
$r.Application("profileWebsite", function(){

    var animEndEventNames = {
                'WebkitAnimation' : 'webkitAnimationEnd',
                'OAnimation' : 'oAnimationEnd',
                'msAnimation' : 'MSAnimationEnd',
                'animation' : 'animationend'
            },
    // animation end event name
            animEndEventName = animEndEventNames[ Modernizr.prefixed( 'animation' ) ]

    //binding functions so the have this as context
    var handleMenuItemClicked = this.bind(handleMenuItemClickedFn);
    var setCurrentState = this.bind(setCurrentStateFn);
    var setCurrentSection = this.bind(setCurrentSectionFn);
    var getSectionBasedOnState = this.bind(getSectionBasedOnStateFn)

    var currentSection = null;

    this.init = function(){

        this.super.init();
        this.skinClass = "app.AppSkin";
        setCurrentState(location.hash);

    }

    /*This function is called when the component is fully created.
      Which means all the nodes have been initialized  for the document

      thus calling here to setup visibilty on the first section
    */

    this.initialize = function(){
        this.super.initialize();
        window.onhashchange = this.bind(locationHashChanged, this);

        //setting up the inital active section;
        setCurrentSectionFn(null, this.currentState);

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

        if(instance === this.homeSection || instance === this.portfolioSection || instance === this.resumeSection)
            instance.addEventListener(animEndEventName, handleSectionAnimationEnd, false);

    }

    var oldSection
    var newSection
    var endOldSection = false,
            endNewSection = false;
    function handleSectionAnimationEnd(event){

        if(oldSection && newSection)
        {
            if(event.target === oldSection[0])
                endOldSection = true;
            if(event.target === newSection[0])
                endNewSection = true;

            if( endNewSection &&  endNewSection) {
                onEndAnimation( oldSection, newSection );
            }
        }

    }


    function onEndAnimation( _oldSection, _newSection ) {
        endOldSection = false;
        endNewSection = false;
        oldSection = null;
        newSection = null;

        resetSectionClasses( _oldSection, _newSection )
    }


    function handleMenuItemClickedFn(event){

        if(event.target === this.aboutMeLink[0])
        {
            window.location.hash = "#aboutme";

        }
        else if(event.target === this.myWorkLink[0])
        {
            window.location.hash = "#mywork";
        }
        else
        {
            window.location.hash = "#myresume";
        }

        setCurrentState(window.location.hash);
    }

    function locationHashChanged() {

        console.log("humm  how many times do i get called");
    }

    function setCurrentStateFn(hash)
    {
        var oldState = this.currentState;
        switch (hash) {
            case '#aboutme':
            {
                this.currentState = "home";
                break;
            }

            case "#mywork":
            {
                this.currentState = "mywork";
                break;
            }

            case "#myresume":
            {

                this.currentState = "resume";
                break;
            }
            default:
            {
                window.location.hash = "#aboutme"
                this.currentState = "home"
                break;
            }
        }

        setCurrentSection(oldState, this.currentState)
    }

    function setCurrentSectionFn(oldState, newState)
    {

         oldSection =  getSectionBasedOnState(oldState)
         newSection =  getSectionBasedOnState(newState)


         if(oldSection && newSection)
         {

             newSection.addClass('section-active');
             var outClass = 'section-scaleDown';
             var inClass = 'section-moveFromRight section-ontop';

             oldSection.addClass(outClass);
             newSection.addClass(inClass);
         }
         else if(newSection)
         {
             newSection.addClass('section-active');
         }


        function handleOldSectionAnimationEnd(event) {
            event.stopImmediatePropagation();
            oldSection.removeEventListener(animEndEventName, handleOldSectionAnimationEnd, false);

        }

        function handleNewSectionAnimationEnd(event) {
            event.stopImmediatePropagation();
            newSection.removeEventListener( animEndEventName, handleNewSectionAnimationEnd, false);
            endNewSection = true;
            if( endOldSection ) {
                onEndAnimation( oldSection, newSection );
            }
        }

    }

    function resetSectionClasses( oldSection, newSection) {
        oldSection.class = "section"
        newSection.class = 'section section-active';
    }

    function getSectionBasedOnStateFn(state){

        switch (state) {
            case 'home':
            {
                return this.homeSection;
            }

            case "mywork":
            {
                return this.portfolioSection;
            }

            case "resume":
            {
                return this.resumeSection;
            }
        }

    }

})