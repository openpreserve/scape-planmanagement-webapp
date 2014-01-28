$.extend({
    getUrlVars : function() {
            var vars = [], hash;
            var hashes = window.location.href.slice(
                            window.location.href.indexOf('?') + 1).split('&');
            for ( var i = 0; i < hashes.length; i++) {
                    hash = hashes[i].split('=');
                    vars.push(hash[0]);
                    vars[hash[0]] = hash[1];
            }
            return vars;
    },
    getUrlVar : function(name) {
            return $.getUrlVars()[name];
    }
});

function parsePlanDetails(xml) {
    var id = $.getUrlVar('id');
	var plan = $(xml).find('plan');
	var props = plan.find('properties');
	$('#details_id').text(id);
	$('#details_title').text(props.attr('name'));
	$('#details_author').text(props.attr('author'));
	$('#details_desc').text(props.find('description').first().text());
	$('#details_owner').text(props.find('owner').first().text());
	$('#details_state').text(props.find('state').attr('value'));

	var change = props.find('changelog');
	$('#create_time').text(change.attr('created'));
	$('#create_owner').text(change.attr('createdBy'));
	$('#change_time').text(change.attr('changed'));
	$('#change_owner').text(change.attr('changedBy'));
	
	var triggers = plan.find('basis').find('triggers');
	var len = triggers.find('trigger').length;
	triggers.find('trigger').each(function(index, element) {
		$('#trigger_table').append('<label>Type</label>');
		$('#trigger_table').append('<p>' + $(this).attr('type') + '</p>');
		$('#trigger_table').append('<label>Description</label>');
		$('#trigger_table').append('<p>' + $(this).attr('description') + '</p>');
		$('#trigger_table').append('<label>Active</label>');
		$('#trigger_table').append('<p>' + $(this).attr('active') + '</p>');
		if (index < len - 1) {
			$('#trigger_table').append('<hr>');
		}
	});
}

function executePlan(planId) {
	// first get the plan
	$.get(pmw_config.pmw_url + '/plan/' + planId)
		.done(function (planData) {
			// now post the plan to the given execute URL
			$.post(pmw_config.pmw_runplan_uri)
				.done(function (data, stText, xhr) {
					if (xhr.status != 200) {
						alert(xhr);
					}else{
						alert(stText);
					}
				})
				.fail(function (xhr, stText, error) {
					alert('An error occured while trying to POST data to \n' + pmw_config.pmw_runplan_uri + '.\n\n' + xhr.statusText + " [" + xhr.status + ']\n\nPlease make sure that the settings in \'config.js\' are correct');
				});
		});
}

function createPlanDetails() {
    var numErrors = 0;
    var numSuccesses = 0;
    var id = $.getUrlVar('id');
    document.title = 'Plan ' + id + ' - Plan Management';
    var planUri = pmw_config.pmw_url + '/plan/' + id; 
    $.ajax({
    	type: "GET",
    	url: planUri,
    	data: {},
    	dataType: "text/xml",
    	success: function () {
    		alert('success');
    	}
    });
    
	$.get(planUri)
		.done(parsePlanDetails);
}

function createPlanOverview() {
	$.get(pmw_config.pmw_url + '/plan-list', {})
		.done(function(xml) {
			var numRecords = $(xml).filter('scape\\:plan-data-collection, plan-data-collection').attr('size');
			$('#recordcount').text('Search returned ' + numRecords + ' plan(s)');
			var aaData = new Array();
			var count = 0;
			$(xml).find('scape\\:plan-data, plan-data')
				.each(function() {
					var row = new Array();
					var planId = $(this).find('scape\\:identifier, identifier').find('scape\\:value, value').first().text();
					var state = $(this).find('scape\\:lifecycle-state, lifecycle-state').attr('plan-state');
					var state_toggle = (state == 'ENABLED') ? 'DISABLED' : 'ENABLED';
					var state_toggle_hint = (state == 'ENABLED') ? 'Disable plan execution' : 'Enable plan execution';
					var link_state_toggle = '<a title="' + state_toggle_hint + '" href="javascript:setPlanState(\'' + planId + '\', \'' + state_toggle + '\')"><img height="20" width="20" src="images/toggle.png" /></a>';
					var link_remove_plan = '<a title="Remove plan" href="javascript:deletePlan(\'' + planId + '\')"><img height="20" width="20" src="images/delete.png" /></a>';
					var link_exec_plan = '<a title="Execute plan" href="javascript:executePlan(\'' + planId + '\')"><img height="20" width="20" src="images/exec.png" /></a>';
					var link_download_plan = '<a title="Download plan" href="javascript:getPlan(\'' + planId + '\')"><img height="20" width="20" src="images/download.png" /></a>';
					row[0] = planId;
					row[1] = $(this).attr('title');
					row[2] = state;
					row[3] = link_download_plan + (state == 'ENABLED' ? link_exec_plan : '') + link_state_toggle + link_remove_plan;
					aaData[count++] = row;
				});
			$('#data_plan').dataTable({
				aaData : aaData,
				iDisplayLength : 25,
				bJQueryUI : true,
				bAutoWidth: false,
				aoColumnDefs: [ {sClass: "col_id", aTargets: [0]},
				                {sClass: "col_title", aTargets: [1]},
				                {sClass: "col_state", aTargets: [2]},
				                {sClass: "col_actions", aTargets: [3]}],
				aoColumns : [ {sWidth : "10%"},
                              {sWidth : "60%"},
                              {sWidth : "10%"},
                              {sWidth : "20%"}],
                fnCreatedRow : 
            	  function (n_row, row_data, data_idx){
	                  $('td:eq(0)',n_row).parent().mouseover(function() {
	                          $(this).addClass('row_hover');
	                  });
	                  $('td:eq(0)',n_row).parent().mouseout(function() {
	                          $(this).removeClass('row_hover');
	                  });
              		}
			});
            $('#data_plan').delegate('tbody > tr > td:not(".col_actions")', 'click', function () {
                record_id = $(this).parent().children()[0].textContent;
                pid = $(this).parent().children()[1].textContent;
                window.location = 'details.html?id=' + record_id;
                });

		});
}

function setPlanState(planId, state) {
	var url = pmw_config.pmw_url + '/plan-state/' + planId + '/' + state;
	$.ajax({
		url: url,
		type: 'PUT',
		success: function () {
			window.location = window.location;
		},
		fail: function () {
			alert('HTTP PUT failed');
		}
	});
}

function getPlan(planId) {
	window.location = pmw_config.pmw_url + '/plan/' + planId;
}

function deletePlan(planId) {
	var url =  pmw_config.pmw_url + '/plan/' + planId;
	var ret = confirm('Please click OK if you are sure you want to *delete* the plan \"' + planId + '\" ?');
	if (ret == true) {
		$.ajax({
			url: url,
			type: 'DELETE',
			success: function () {
				var pos = window.location.href.lastIndexOf('/');
				var redirect = window.location.href.substring(0, pos) + '/index.html';
				window.location = redirect;
			},
			fail: function () {
				alert('HTTP DELETE failed');
			}
		});
	}
}

function processUpload(data) {
	var planId = $("#plan_id").val();
	if (planId.length == 0 || planId === 'Generated UUID') {
		planId = createUUID();
	}
	var url = pmw_config.pmw_url + '/plan/' + planId;
    $.ajax({
    	url: url,
    	type: 'PUT',
    	data: data, 
    	processData: false,
    	contentType: false,
    	success: uploadSuccess,
    	error: uploadError
    });
    return true;
}

function startUpload(){
	reader = new FileReader();  
	reader.onloadend = function (e) {   
		processUpload(e.target.result);  
	};  
	var input = document.getElementById('plan_data');
	reader.readAsBinaryString(input.files[0]);  
}

function uploadSuccess(){
	window.location = window.location;
    return true;   
}

function uploadError(xhr, stText, error) {
	alert('An error occured while uploading plan!\n' + stText + '\n\n' + xhr.statusText + '[' + xhr.status + ']');
}

/* copied from the web source http://jsfiddle.net/briguy37/2MVFd/ */
function createUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
};
