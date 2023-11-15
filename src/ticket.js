const debug = require("debug")("slash-command-template:ticket");
const api = require("./api");
const payloads = require("./payloads");
const config = require("./dbConfig");
const pool = require("./pool");
const generateUUID = require("./guid");

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
  const guid = await generateUUID();
  console.log('---> guid ', guid);
  // DEBUG
  console.log("VALUES OUTPUT");
  console.log(JSON.stringify(values));
  // call create record to insert record in pg database
  console.log('---> bu unit ', values.bu_block.bu.selected_option.text.text);
  const BU_UNIT = values.bu_block.bu.selected_option.text.text;
  
  console.log('---> name ', values.name_block.name.value); 
  const PROJECT_NAME = values.name_block.name.value;

  console.log('---> type ', values.type_block.type.selected_option.text.text);
  const TYPE = values.type_block.type.selected_option.text.text;

  console.log('---> brief ', values.brief_block.brief.value);
  const BRIEF = values.brief_block.brief.value;
  
  console.log('---> comm_block ',values.comm_block.communications.value);
  const COMMUNICATIONS = values.comm_block.communications.value;
  
  let NEED = '';
  values.need_block.need.selected_options.forEach((element) => {
    console.log('---> need ',element.text.text);
    NEED = NEED + ';' + element.text.text;
  });
  NEED = NEED.slice(1);
  console.log('---> need ',NEED);
  
  let LANG='';
  values.languages_block.languages.selected_options.forEach((element) => {
    console.log('---> need ',element.text.text);
    LANG = LANG + ';' + element.text.text;
  });  
  LANG = LANG.slice(1);
  console.log('---> need ',LANG);

  let OBJECTIVE='';
  values.objective_block.objective.selected_options.forEach((element) => {
    console.log('---> need ',element.text.text);
    OBJECTIVE = OBJECTIVE + ';' + element.text.text;
  });    
  OBJECTIVE = OBJECTIVE.slice(1);
  console.log('---> need ',OBJECTIVE);
  

  console.log('---> goal_block ',values.goal_block.goal.value);
  const GOAL = values.goal_block.goal.value;

  console.log('---> budget_block ',values.budget_block.budget.value);
  const BUDGET =  values.budget_block.budget.value;
  
  console.log('---> date_block ',values.date_block.date.selected_date);    
  const PROJECT_DATE = values.date_block.date.selected_date;

  const client = await pool.connect();
  let db_values = [
    BU_UNIT,
    COMMUNICATIONS,
    NEED,
    LANG,
    guid,
    BRIEF,
    TYPE,
    OBJECTIVE,
    PROJECT_DATE,
    GOAL,
    PROJECT_NAME,
    BUDGET,
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
