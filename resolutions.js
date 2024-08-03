const CLASS_NAME_ITEM_SUFFIX = 'item-';

const RESOLUTIONS = {
    xs: {name: 'xs', res: 0,rang: 0, classSuffix: `${CLASS_NAME_ITEM_SUFFIX}xs-`},
    sm: {name: 'sm', res: 576,rang: 1, classSuffix: `${CLASS_NAME_ITEM_SUFFIX}sm-`},
    md: {name: 'md', res: 768,rang: 2, classSuffix: `${CLASS_NAME_ITEM_SUFFIX}md-`},
    lg: {name: 'lg', res: 992,rang: 3, classSuffix: `${CLASS_NAME_ITEM_SUFFIX}lg-`},
    xl: {name: 'xl', res: 1200,rang: 4, classSuffix: `${CLASS_NAME_ITEM_SUFFIX}xl-`},
    xxl: {name: 'xxl', res: 1400,rang: 5, classSuffix: `${CLASS_NAME_ITEM_SUFFIX}xxl-`},
    all: {name: 'all', res: null,rang: -1, classSuffix: CLASS_NAME_ITEM_SUFFIX},
};
class ResolutionManager{
    constructor(){
        this.paliers = RESOLUTIONS;
    }

    getScreenResolutionPalier(){
        let width = window.innerWidth;
        let resolutionPalier = this.paliers.all;
        for (const key in this.paliers) {
            const palier = this.paliers[key];
            if(width >= palier.res && palier.rang !== -1){
                resolutionPalier = palier;
            }
        }
        return resolutionPalier;
    }
    getPaliersFromClassList(elementClassList){
        let paliers = [];
        elementClassList.forEach((item) => {
            for (const key in this.paliers) {
                const palier = this.paliers[key];
                if(item.startsWith(palier.classSuffix)){
                    paliers.push({palier:palier, className:item});
                    break;
                }
            }
        });
        return paliers;
    }

    /*
    * Retourne le nombre d'items pour une classe donnée
     */
    getNbItemsClass(elementClass, palierClass){
        if (elementClass === null || elementClass === undefined || elementClass === '' || palierClass === null || palierClass === undefined) {
            return 0;
        }
        if(elementClass.startsWith(palierClass.classSuffix)){
            return  parseInt(elementClass.split('-')[2], 10);
        }
        return 0;
    }

    getNbItemsPerView(element){
        const palierEcran = this.getScreenResolutionPalier();
        const classListElement = element.classList;
        const paliersElement = this.getPaliersFromClassList(classListElement);
        let nbItems = 0;
        let palierEncours = this.paliers.all;
        let classNameEncours = '';

        paliersElement.forEach((palierClass) => {
            if(palierClass.palier.name === palierEcran.name){
                nbItems = this.getNbItemsClass(palierClass.className, palierClass.palier);
            }
        });
        if (nbItems === 0) {
            paliersElement.forEach((palierClass) => {
                if (palierClass.palier.rang >= palierEncours.rang) {
                    palierEncours = palierClass.palier;
                    classNameEncours = palierClass.className;

                }
            });

            nbItems = this.getNbItemsClass(classNameEncours, palierEncours);
        }
        if (nbItems === 0) {
            paliersElement.forEach((palierClass) => {
                if(palierClass.palier.name === this.paliers.all.name){
                    nbItems = this.getNbItemsClass(element.className, palierClass.palier.key);
                }
            });
        }
        if (nbItems !== 0) {
            return Math.round(12 / nbItems);
        }

        return nbItems;
    }
}

export default ResolutionManager;