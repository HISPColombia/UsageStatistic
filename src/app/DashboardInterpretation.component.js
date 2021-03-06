import React from 'react';

import { getInstance } from 'd2/lib/d2';

import Paper from 'material-ui/Paper';
import Snackbar from 'material-ui/Snackbar';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';
import CircularProgress from 'material-ui/CircularProgress';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';
import CheckboxUI from 'material-ui/Checkbox';

import { green300, lime300, lightGreen300, yellow300, orange300, deepOrange300, red300 } from 'material-ui/styles/colors';

import actions from '../actions';

import ChartInterpretation from './Chart.component';
import FilterBy from './Filter.component.js';

import LoadingMask from 'd2-ui/lib/loading-mask/LoadingMask.component';

//the day ranges for displaying data
const loginStatusRanges = [7, 30, 60, 'Older'];
const loginStatusColors = [green300, lime300, yellow300, orange300, deepOrange300, red300];

const DASH_USERGROUPS_CODE = 'BATapp_ShowOnDashboard';

// TODO: Rewrite as ES6 class
/* eslint-disable react/prefer-es6-class */
export default React.createClass({

  propTypes: {
    d2: React.PropTypes.object,
    groups: React.PropTypes.object.isRequired,
    ouRoot: React.PropTypes.object.isRequired,
  },

  contextTypes: {
    d2: React.PropTypes.object,
  },

  getInitialState() {
    return {
      ouRoot: {},
      userGroups: {},          // all user groups, needed for filter

      attributeID: '',
      userGroupsFiltered: {},  // default display groups
      rawUserGroups: {},
      UserGroupsAgrupated:{},
      organisationUnitAgrupated:{},
      customFilterBy: null,
      customFilter: null,

      userAll: {},
      ouLevel: 1,
      waiting: 0,
      renderListGroups:false,
      renderChart:false,
    };
  },

  componentDidMount() {
    if (Object.keys(this.props.groups).length > 0) {
      this.setState({
        waiting:1,
        renderChart: false,
        userGroups:this.props.groups
      });
      this.initReport();
    }
  },
  clearAllSelected(){
    this.setState({userGroupsFiltered:{}});
  },
  initReport() {
    //init object
    let groups = this.props.groups;
    let filtered = this.filterGroups(groups);
    let arrUg=Object.keys(filtered);
    //get group with statistic information
    //this.handleReportStatus().then(respGroup=>{    
       //setting statistic information to group preselected       
      //  for (let ug of arrUg ) {
      //   this.addGroup(ug) 
      // }
     
    //})
    this.setState({renderListGroups:true,renderChart:true});    
  },

//update how they want to filter the data
handleFilterByChange(filterBy, value,displayNameSelected) {
  //toggle the search children box if they switch from group to ou
   this.setState({
      filterBy,displayNameSelected
    })


    this.setState({userGroupsFiltered:{}})
    
    if(value!=null)
      if (this.state.filterBy === 'ou') {
        var OUIList="";
        
        value.forEach(v => {
          var uidsPath=v.split("/");
          var OUID=uidsPath[uidsPath.length-1];
         
          OUIList=OUIList+","+OUID;
        });
       this.handleReportStatus(OUIList,displayNameSelected)       
        this.handleFilterChangeOU(filterBy, value)
      }
      else{
        this.handleReportStatus(value)
          this.handleFilterChangeUserGRoup(filterBy, value);
      }

},
 //Include Child OUs checkbox
 handleFilterChildOUs(event, value) {
  this.setState({ searchChildOUs: value });
  this.handleFilterChangeOU("ou",this.state.customFilter)

},
  //THey want to show a specific User group or org here
  handleFilterChangeOU(filterBy, value) {
    this.setState({
      customFilterBy: filterBy,
      customFilter: value,
      processing: true,
      renderChart:false
    });
  },
  //THey want to show a specific User group or org here
  handleFilterChangeUserGRoup(filterBy, value) {
    this.setState({
      customFilterBy: filterBy,
      customFilter: value,
      processing: true,
      renderChart:false
    });
    //console.log("CUSTOM CHART:", value);
    if (filterBy === 'group' && value !== null) {
      if(this.state.userGroupsFiltered[value]){
        delete this.state.userGroupsFiltered[value];
        this.setState({
          processing: false,
          renderChart:false
        })
      }
      else{
        this.addGroup(value);
      }      
    }
  },

  //get the UID for our secret sauce attribute
  getAttributeID() {
    if (this.state.attributeID !== '') {
      return this.state.attributeID;
    }
    for (let a of Object.keys(this.props.attribs)) {
      if (this.props.attribs[a] === DASH_USERGROUPS_CODE) {
        this.setState({ attributeID: a,renderChart:true });
        return a;
      }
    }
    return '';
  },

  addGroup(uid) {
    let groups = this.state.rawUserGroups;
    let userGroupsFiltered=this.state.userGroupsFiltered
    if (groups[uid]) {
      userGroupsFiltered[uid] = groups[uid];
    }
    else {
      userGroupsFiltered[uid] = { "id": uid, "displayName": this.props.groups[uid].displayName, "data": { "7 Days": 0, "15 Days": 0, "30 Days": 0, "60 Days": 0, "Older": 0, "None": this.props.groups[uid].users.length } };
    }
    this.setState({ waiting: 0, renderChart:false,processing: false, userGroupsFiltered });
  },

  //filter out all non FILTER attributed groups
  filterGroups(groups) {
    //find the user group attrib ID for displayable UserGroups on the dashboard
    let attributeID = this.getAttributeID();

    //only keep the groups that are in our DASH_USERGROUPS_CODE
    let g = {};
    for (let ug of Object.keys(groups)) {
      if (this.props.groups[ug].attributeValues.length > 0) {
        groups[ug].attributeValues = this.props.groups[ug].attributeValues;
      }
      if (groups[ug].hasOwnProperty('attributeValues')) {
        for (let attr in groups[ug].attributeValues) {
          if (groups[ug].attributeValues[attr].attribute.id === attributeID) {
            if (groups[ug].attributeValues[attr].value === 'true') {
              g[ug] = groups[ug];
            }
          }
        }
      }
    }
    return g;
  },
  async seeReport(){
    this.setState({renderChart:true});
  },
  async setEmptyUIReport(id,aggregateCaregory,ouName){
    //agrega OU sin datos para visualizar en el C
     let users = await this.getUserByOU(id)
      //let NumUser=  this.getGroup(dataValue.userGroupId); 
     
      aggregateCaregory[1][id] = { "id": id, "displayName": ouName, "data": { "7 Days": 0, "15 Days": 0, "30 Days": 0, "60 Days": 0, "Older": 0, "None": users.pager.total-1} };
      this.setState({userGroupsFiltered: aggregateCaregory[1],renderChart:false});
  },
  async handleReportStatus(id,displayNameSelected) {
    if(this.state.searchChildOUs==true && this.state.filterBy === 'ou')
      var responseReport = await this.getReportinCludeChildOU(id);
    else
      var responseReport= await this.getReport(id);
    if(this.state.filterBy === 'ou'){
      await this.aggregateResultOU(responseReport);
      var userGroupsFiltered= await this.SetChartOU(this.state.organisationUnitAgrupated);       
      id.split(",").forEach(async (_id,index)=>{
          if(!this.state.organisationUnitAgrupated.find((ou)=>ou.id.includes(_id))){
            await this.setEmptyUIReport(_id,userGroupsFiltered,displayNameSelected[index-1])
          }
      })
    }      
    else{
      await this.aggregateResult(responseReport);
      if(Object.keys(this.state.UserGroupsAgrupated).length>1){
         return await this.SetChart(this.state.UserGroupsAgrupated);  
    }
      else
        return {}
    }
     
    
 
 },

 //
 async getReportinCludeChildOU(id) {
       if(this.state.searchChildOUs==true){
      let ids=id.split(",");
      let responseReport=[];
      ids.forEach(idx=>{   
        if(idx!="")
          this.getReport(idx).then( cResp=>{
            responseReport= responseReport.concat(cResp);
          });
      });
      return responseReport;
    }

},
 //

  //Get different in days  between two dates.
  getCategory(dateinit, dateend) {
    var DateInitt = new Date(dateinit).getTime();
    var dateEndt = new Date(dateend).getTime();
    var diff = (dateEndt - DateInitt) / (1000 * 60 * 60 * 24)
    switch (true) {
      case diff <= 7:
        return ("7 Days");
        break;
      case diff <= 15:
        return ("15 Days");
        break;
      case diff <= 30:
        return ("30 Days");
        break;
      case diff <= 60:
        return ("60 Days");
        break;
      default:
        return ("Older")
    }
  },

  //agregate API result User Group

  async aggregateResult(dataValues) {
    var aggregateValue = [];
    var lastdateInterpretation=[];
    var lastdateComment=[];
    return  dataValues.map((dataValue) => {
      if(dataValue.user==undefined){
        dataValue.user=dataValue.reportTable.user;
      }
      dataValue.user.userGroups.map((userGroup) => {
        //verify if user group already there exist in array
        var index = aggregateValue.findIndex(x => x.id === dataValue.user.id + "-" + userGroup.id);
        if (index === -1) {
          aggregateValue.push({ "id": dataValue.user.id + "-" + userGroup.id, "user": dataValue.user.id, "userName": dataValue.user.name, "created": dataValue.created, "userGroupName": userGroup.name, "userGroupId": userGroup.id });
        }
        else {
          var dateInterpretation = new Date(dataValue.created);
          if (dateInterpretation > lastdateInterpretation[dataValue.user.id]) {
            aggregateValue[index] = { "id": dataValue.user.id + "-" + userGroup.id, "user": dataValue.user.id, "userName": dataValue.user.name, "created": dataValue.created, "userGroupName": userGroup.name, "userGroupId": userGroup.id };
            lastdateInterpretation[dataValue.user.id] = dateInterpretation;
          }
        }

      });
      dataValue.comments.map((dataValuecomm) => {
        dataValuecomm.user.userGroups.map((userGroupCom) => {
          var indexm = aggregateValue.findIndex(x => x.id === dataValuecomm.user.id + "-" + userGroupCom.id);
          if (indexm === -1) {
            aggregateValue.push({ "id": dataValuecomm.user.id + "-" + userGroupCom.id, "user": dataValuecomm.user.id, "userName": dataValuecomm.user.name, "created": dataValuecomm.created, "userGroupName": userGroupCom.name, "userGroupId": userGroupCom.id });
          }
          else {
            var dateComment = new Date(dataValuecomm.created);
            if (dateComment > lastdateComment[userGroupCom.id]) {
              aggregateValue[indexm] = { "id": dataValuecomm.user.id + "-" + userGroupCom.id, "user": dataValuecomm.user.id, "userName": dataValuecomm.user.name, "created": dataValuecomm.created, "userGroupName": userGroupCom.name, "userGroupId": userGroupCom.id };
              lastdateComment[userGroupCom.id]=dateComment;
            }
          }
        });

      });
      if(dataValues[dataValues.length-1].id==dataValue.id){
        this.setState({UserGroupsAgrupated:aggregateValue,renderChart:false});
        return aggregateValue;
      }
      
    });
  
  },
  async aggregateResultOU(dataValues) {
    var aggregateValue = [];
    var lastdateInterpretation=[];
    var lastdateComment=[];
    return  dataValues.map((dataValue) => {
      if(dataValue.user==undefined){
        dataValue.user=dataValue.reportTable.user;
      }
      dataValue.user.organisationUnits.map((organisationUnit) => {
        //verify if user group already there exist in array
        var index = aggregateValue.findIndex(x => x.id === dataValue.user.id + "-" + organisationUnit.id);
        if (index === -1) {
          aggregateValue.push({ "id": dataValue.user.id + "-" + organisationUnit.id, "user": dataValue.user.id, "userName": dataValue.user.name, "created": dataValue.created, "organisationUnitName": organisationUnit.name, "organisationUnitId": organisationUnit.id });
        }
        else {
          var dateInterpretation = new Date(dataValue.created);
          if (dateInterpretation > lastdateInterpretation[dataValue.user.id]) {
            aggregateValue[index] = { "id": dataValue.user.id + "-" + organisationUnit.id, "user": dataValue.user.id, "userName": dataValue.user.name, "created": dataValue.created, "organisationUnitName": organisationUnit.name, "organisationUnitId": organisationUnit.id };
            lastdateInterpretation[dataValue.user.id] = dateInterpretation;
          }
        }

      });
      dataValue.comments.map((dataValuecomm) => {
        dataValuecomm.user.organisationUnits.map((organisationUnitcomm) => {
          var indexm = aggregateValue.findIndex(x => x.id === dataValuecomm.user.id + "-" + organisationUnitcomm.id);
          if (indexm === -1) {
            aggregateValue.push({ "id": dataValuecomm.user.id + "-" + organisationUnitcomm.id, "user": dataValuecomm.user.id, "userName": dataValuecomm.user.name, "created": dataValuecomm.created, "organisationUnitName": organisationUnitcomm.name, "organisationUnitId": organisationUnitcomm.id });
          }
          else {
            var dateComment = new Date(dataValuecomm.created);
            if (dateComment > lastdateComment[organisationUnitcomm.id]) {
              aggregateValue[indexm] = { "id": dataValuecomm.user.id + "-" + organisationUnitcomm.id, "user": dataValuecomm.user.id, "userName": dataValuecomm.user.name, "created": dataValuecomm.created, "organisationUnitName": organisationUnitcomm.name, "organisationUnitId": organisationUnitcomm.id };
              lastdateComment[organisationUnitcomm.id]=dateComment;
            }
          }
        });

      });
      if(dataValues[dataValues.length-1].id==dataValue.id){
        this.setState({organisationUnitAgrupated:aggregateValue,renderChart:false});
        return aggregateValue;
      }
      
    });
  
  },
  // getGroup(uid) {
  //   let groups = this.state.userGroups;

  //   for (let g in groups) {
  //     if (g == uid) {
  //       return groups[g].users.length;
  //     }
  //   };
  //   return 0;
  // },
  //set result to Chart value  and it group by userGroup counting the number of interprettion created by each user in current group
    //Find total users in group/ou
    async getUserByOU(OUID) {
      if (OUID ==undefined || OUID==null) {
          return {}
      }
      try {
        var noneCount=0;
        const d2 = this.props.d2;
        const api = d2.Api.getApi();
        let search = {
          fields: 'id',
          filter:[],
        };         
        if(this.state.searchChildOUs==true)
          search.filter.push('organisationUnits.path:like:' + OUID);
        else
          search.filter.push('organisationUnits.id:eq:' + OUID);       
        return await api.get('users', search);
      }
      catch (e) {
        console.error("Error:",e,OUID);
      }
      return 0;
    },
  async SetChartOU(dataValuesAgregated) {
    var aggregateCaregory = [];
    var lastdateInterpretation = null;
    var lastdateComment = null;
    let fg = {};
    return dataValuesAgregated.map((dataValue) => {
      //add Interpretation
      var currentDate = new Date();
      let category = this.getCategory(dataValue.created.substring(0, 10), currentDate.toISOString().substring(0, 10));
      //verify if user grup already there exist in array
     
      var index = aggregateCaregory.findIndex(x => (x.id === dataValue.organisationUnitId));
      try {
        //if (this.state.userGroups[dataValue.userGroupId] != undefined) {
          //get list all user 
          if (aggregateCaregory[dataValue.organisationUnitId] == undefined) {

            //get user by ou
            this.getUserByOU(dataValue.organisationUnitId).then((users=>{
                 //let NumUser=  this.getGroup(dataValue.userGroupId); 
                aggregateCaregory[dataValue.organisationUnitId] = { "id": dataValue.organisationUnitId, "displayName": dataValue.organisationUnitName, "data": { "7 Days": 0, "15 Days": 0, "30 Days": 0, "60 Days": 0, "Older": 0, "None": users.pager.total} };
                aggregateCaregory[dataValue.organisationUnitId].data[category] = 1;
                aggregateCaregory[dataValue.organisationUnitId].data["None"]--;
            }))
           

          }
          else {
            aggregateCaregory[dataValue.organisationUnitId].data["None"]--;
            if (aggregateCaregory[dataValue.organisationUnitId].data[category])
              aggregateCaregory[dataValue.organisationUnitId].data[category]++;
            else
              aggregateCaregory[dataValue.organisationUnitId].data[category] = 1;
          }
       // }
       // else {
       //   console.log("El usuario no tiene acceso al grupo " + dataValue.organisationUnitName);
       // }
      }
      catch (err) {
        console.log("error usuario no tiene acceso al grupo " + dataValue.organisationUnitName);
      };
      if(dataValuesAgregated[dataValuesAgregated.length-1].id==dataValue.id){
        this.setState({userGroupsFiltered:aggregateCaregory,renderChart:false});
        return aggregateCaregory; 
      }
      
    });
 
  },

  async SetChart(dataValuesAgregated) {
    var aggregateCaregory = [];
    var lastdateInterpretation = null;
    var lastdateComment = null;
    let fg = {};
    return dataValuesAgregated.map((dataValue) => {
      //add Interpretation
      var currentDate = new Date();
      let category = this.getCategory(dataValue.created.substring(0, 10), currentDate.toISOString().substring(0, 10));
      //verify if user grup already there exist in array
      var index = aggregateCaregory.findIndex(x => (x.id === dataValue.userGroupId));
      try {
        if (this.state.userGroups[dataValue.userGroupId] != undefined) {
          //get list all user 
          if (aggregateCaregory[dataValue.userGroupId] == undefined) {

            //let NumUser=  this.getGroup(dataValue.userGroupId); 
            aggregateCaregory[dataValue.userGroupId] = { "id": dataValue.userGroupId, "displayName": dataValue.userGroupName, "data": { "7 Days": 0, "15 Days": 0, "30 Days": 0, "60 Days": 0, "Older": 0, "None": this.state.userGroups[dataValue.userGroupId].users.length } };
            aggregateCaregory[dataValue.userGroupId].data[category] = 1;
            aggregateCaregory[dataValue.userGroupId].data["None"]--;

          }
          else {
            aggregateCaregory[dataValue.userGroupId].data["None"]--;
            if (aggregateCaregory[dataValue.userGroupId].data[category])
              aggregateCaregory[dataValue.userGroupId].data[category]++;
            else
              aggregateCaregory[dataValue.userGroupId].data[category] = 1;
          }
        }
        else {
          console.log("El usuario no tiene acceso al grupo " + dataValue.userGroupName);
        }
      }
      catch (err) {
        console.log("error usuario no tiene acceso al grupo " + dataValue.userGroupName);
      };
      if(dataValuesAgregated[dataValuesAgregated.length-1].id==dataValue.id){
        this.setState({rawUserGroups:aggregateCaregory,renderChart:false});
        return aggregateCaregory; 
      }
      
    });
 
  },

  //Find total users in group/ou
  async  getReport(id) {
    const d2 = this.props.d2;
    const api = d2.Api.getApi();
    let search = {
      fields: 'id,type,user[name,id,userGroups[id,name,attributeValue],organisationUnits[id,path,name]],created,lastUpdated,comments[id,user[name,id,userGroups[id,name,attributeValue],organisationUnits[id,path,name]],created,lastUpdated],reportTable[user[id,userGroups[id,name,attributeValue],organisationUnits[id,path,name]]]', //'id,type,user[name,id,userGroups[id,name,attributeValue,organisationUnits[id,path]]],created,lastUpdated,comments[id,user[name,id,userGroups[id,name,attributeValue],organisationUnits[id,path]]],created,lastUpdated],reportTable[user[id,userGroups[id,name,attributeValue],organisationUnits[id,path]]]]',
      paging:false
    };
    if (this.state.filterBy === 'ou') {
      if(this.state.searchChildOUs)
        search["filter"]='user.organisationUnits.path:like:['+id+']'
      else
        search["filter"]='user.organisationUnits.id:in:['+id+']'
    }
    else{
      search["filter"]='user.userGroups.id:in:['+id+']'
    }
    let resultApi = await api.get('interpretations', search)
    if (resultApi.hasOwnProperty('interpretations')) {
      return resultApi.interpretations;
    }
    else {
      this.setState({
        data: {},
        renderChart:false
      });
      return null;
    }
  },
  rendercomponents(){
    console.log(this.state.filterBy === 'ou'?this.state.userGroupsFiltered:this.state.userGroupsFiltered)
    const d2 = this.props.d2;
    let options_groups = {
      colors: loginStatusColors,
      chart: { type: 'bar', },
      title: { text: (this.state.filterBy === 'ou'?'Interpretations and Comments by Organisation Units':'Interpretations and Comments by Group') },
      xAxis: { categories: [], title: { text: (this.state.filterBy === 'ou'?'Organisation Units':'User Group') }, },
      yAxis: { min: 0, title: { text: '% of users who have Interpreted or Commented in within X days' } },
      legend: { reversed: false },
      tooltip: {
        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
        shared: true
      },
      plotOptions: { series: { stacking: 'percent' } },
      series: [{ "name": "7 Days" }, { "name": "15 Days" }, { "name": "30 Days" }, { "name": "60 Days" }, { "name": "Older" }, { "name": "None" }]
    };

    let haveGroups = false;
    let haveFilteredGroups = false;
    if (Object.keys(this.props.groups).length > 0) {
      haveGroups = true;
    }
    if (haveGroups === true && Object.keys(this.props.groups).length > 0) {
      haveFilteredGroups = true;
    }

    return (
    <div className="container">
    <Paper className='item'>
      {/* <p>Add additional groups:</p>
      <FilterBy value={this.state.filterBy}
        onFilterChange={this.handleFilterChange}
        groups={this.props.groups}
        groupsfiltered={this.state.userGroupsFiltered}
        disabled={this.state.processing}
        clearSelected={this.clearAllSelected}
      /> */}
      <p>{d2.i18n.getTranslation("app_ttl_filterUser")}</p>
      <FilterBy 
        value={this.state.filterBy}
        onFilterChange={this.handleFilterByChange}
        groups={this.state.userGroups}
        ouRoot={this.props.ouRoot}
        multiselect={true}
        changeRoot={this.getOuRoot}
       />
        {(this.state.filterBy == 'ou')?
        <CheckboxUI 
        label={d2.i18n.getTranslation("app_lbl_filter_include_child_ou")}
        checked={this.state.searchChildOUs}
        onCheck={this.handleFilterChildOUs}
        disabled={this.state.filterBy != 'ou' && this.state.customFilter.length==0}
        labelStyle={{ color: 'grey', fontSize: 'small' }} 
        />:""}
      <div style={{height:35}}></div>
      <RaisedButton
        label={d2.i18n.getTranslation("app_btn_update")}
        labelPosition="before"
        primary={true}
        //disabled={this.state.processing}
        onClick={this.seeReport}
        icon={<FontIcon className="material-icons">refresh</FontIcon>}
        style={{ 'clear': 'both' }}
      />
       {this.state.processing?<CircularProgress size={1} style={{ float: 'right' }} />:""}
    </Paper>

    <Paper className='item'>
      <h3 className="subdued title_description">{d2.i18n.getTranslation('app_dashboard_user_interpretation')}</h3>
      <ChartInterpretation container='chartGroups' options={options_groups} groups={(this.state.filterBy === 'ou'?this.state.userGroupsFiltered:this.state.userGroupsFiltered)} renderChart={this.state.renderChart}  />

      {(haveGroups === true && haveFilteredGroups === false) ?
        (<p>No user groups with the {DASH_USERGROUPS_CODE} attribute found. Consult the help docs.</p>) : null
      }
      {(this.state.waiting && this.state.waiting > 0) ? <CircularProgress size={1} style={{ float: 'right' }} /> : null}
    </Paper>

  </div>
    )
  },
  render() {
    return (
      <div>
        {this.state.renderListGroups?this.rendercomponents():<LoadingMask />}
      </div>
      
    );
  },
});
