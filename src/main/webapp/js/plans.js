
// init the site by requesting the plan overview from the SCAPE repo
$(document).ready(function() {  
	createPlanOverview();
});  

function retrievePlan() {
	
}

function createPlan() {
	
}

function updatePlan() {
	
}

function deletePlan() {
	
}

function listPlans() {
	
}

function createPlanOverview() {
	$.get('http://localhost:8080/fcrepo/rest/scape/plan/sru?version=1&operation=searchRetrieve&query=*',{}).done(function(xml) {
		$(xml).find('srw\\:searchretrieveresponse, searchretrieveresponse').each(function() {
			numRecords = parseInt($(this).find('srw\\:numberofrecords, numberofrecords').first().text());
			$('#recordcount').text('Search returned ' + numRecords + ' plan(s)');
			var aaData = new Array();
			var count = 0;
			$(this).find('srw\\:record, record').each(function () {
				var row = new Array();
				row[0]=$(this).find('srw\\:extraRecordData, extraRecordData').first().text();
				row[1]= 
				row[2]=
				row[3]=
				aaData[count++] = row;
			});
			$('#data_plan').dataTable({
                aaData : aaData,
                iDisplayLength: 25,
                bJQueryUI : true
			});
		});
	});
}

