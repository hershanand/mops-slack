const debug = require("debug")("slash-command-template:ticket");
const api = require("./api");
const payloads = require("./payloads");
const config = require("./dbConfig");
const pool = require("./pool");

/*
 *  Send project creation confirmation via
 *  chat.postMessage to the user who created it
 */
const sendConfirmation = async (ticket) => {
  // open a DM channel for that user
  let channel = await api.callAPIMethod("conversations.open", {
    users: ticket.userId,
  });

  let message = payloads.confirmation({
    channel_id: channel.channel.id,
    bu: ticket.bu,
    name: ticket.name,
    type: ticket.type,
  });

  let result = await api.callAPIMethod("chat.postMessage", message);
  debug("sendConfirmation: %o", result);
};

// Create project. Call users.find to get the user's email address
// from their user ID
const create = async (userId, view) => {
  let values = view.state.values;

  // DEBUG
  console.log("VALUES OUTPUT");
  console.log(JSON.stringify(values));
  // call create record to insert record in pg database
  console.log('---> bu unit ', values.bu_block.bu.selected_option.text.text);
  console.log('---> name ', values.name_block.name.value);  
  console.log('---> type ', values.type_block.type.selected_option.text.text);
  console.log('---> brief ', values.brief_block.brief.value);
  console.log('---> comm_block ',values.comm_block.communications.value);;    

  values.need_block.need.selected_options.forEach((element) => {
    console.log('---> need ',element.text.text);
  });

  values.languages_block.languages.selected_options.forEach((element) => {
    console.log('---> need ',element.text.text);
  });  

  values.objective_block.objective.selected_options.forEach((element) => {
    console.log('---> need ',element.text.text);
  });    
  

  console.log('---> goal_block ',values.goal_block.goal.value);;
  console.log('---> budget_block ',values.budget_block.budget.value);;
  console.log('---> date_block ',values.date_block.date.selected_date);;    


  const client = await pool.connect();
  let db_values = [
    "EMEA",
    20,
    "Copy;Creative",
    "English;Spanish",
    "P-102",
    "https://salesforce.quip.com/BDAkAZ2LNBtK#temp:C:BAAf231b29341b44db9b4fe983c0",
    "Campaign",
    "New Members",
    "2023-12-31",
    100,
    "US - SMB2",
    999,
  ];
  try {
    await client.query("BEGIN");
    const queryText =
      "INSERT INTO salesforce.Project__c (business_unit__c, communications__c, needs__c, languages__c, external_ref_id__c, brief__c, type__c, objective__c, due_date__c, goal__c, project_name__c, budget__c) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id";
    const res = await client.query(queryText, db_values);
    await client.query("COMMIT");
    console.log(res.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  console.log("RESPONSE OUTPUT", response);

  let result = await api.callAPIMethod("users.info", {
    user: userId,
  });

  await sendConfirmation({
    userId,
    userEmail: result.user.profile.email,
    bu:
      (values.bu_block.bu.selected_option &&
        values.bu_block.bu.selected_option.text.text) ||
      "not assigned",
    name: values.name_block.name.value || "_empty_",
    type:
      (values.type_block.type.selected_option &&
        values.type_block.type.selected_option.text.text) ||
      "not assigned",
  });
};

module.exports = { create, sendConfirmation };
