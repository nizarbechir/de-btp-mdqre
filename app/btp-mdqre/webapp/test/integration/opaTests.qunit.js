sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'btpmdqre/test/integration/FirstJourney',
		'btpmdqre/test/integration/pages/RulesList',
		'btpmdqre/test/integration/pages/RulesObjectPage'
    ],
    function(JourneyRunner, opaJourney, RulesList, RulesObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('btpmdqre') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheRulesList: RulesList,
					onTheRulesObjectPage: RulesObjectPage
                }
            },
            opaJourney.run
        );
    }
);