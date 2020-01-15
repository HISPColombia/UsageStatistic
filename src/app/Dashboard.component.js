import React from 'react';


import Paper from 'material-ui/Paper';
import CircularProgress from 'material-ui/CircularProgress';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';

import { green300,lime300, yellow300, orange300, deepOrange300, red300 } from 'material-ui/styles/colors';

import actions from '../actions';

import ChartLogins from './Chart.component';
import CheckboxUI from 'material-ui/Checkbox';
import FilterBy from './Filter.component.js';
import LoadingMask from 'd2-ui/lib/loading-mask/LoadingMask.component';
//the day ranges for displaying data
const loginStatusRanges = [7, 15, 30, 60, 'Older','None'];
const loginStatusColors = [green300, lime300 , yellow300, orange300, deepOrange300, red300];

//const DASH_USERGROUPS_CODE = 'BATapp_ShowOnDashboard';

const styles={
  textSeach:{
    width:'100%'
  }
}
// TODO: Rewrite as ES6 class
/* eslint-disable react/prefer-es6-class */
export default React.createClass({

  propTypes: {
    d2: React.PropTypes.object,
    //groups: React.PropTypes.array.isRequired,
    ouRoot: React.PropTypes.object.isRequired,
  },

  contextTypes: {
    d2: React.PropTypes.object,
  },

  getInitialState() {
    return {
      userGroups: {},          // all user groups, needed for filter

      attributeID: '',
      userGroupsFiltered: {},  // default display groups
      customFilterBy: null,
      customFilter: null,
      waiting: 0,
      processing:false,
      renderChart:false,
      renderListGroups:false,
      filterBy: 'none',
      ouRoot:{},
      selectedOU:[]
    };
  },


  componentDidMount() {
     if (Object.keys(this.props.groups).length > 0) {
      this.setState({
        waiting:1,
        renderChart: false
      });
      this.initReport();
    }
     
  },
  clearAllSelected(){
    this.setState({userGroupsFiltered:{}});
  },
  seeReport(){
    this.setState({renderChart: true});
  },
  initReport() {
  
    let groups = this.props.groups;
    this.setState({
      userGroupsFiltered: {},
      userGroups: this.props.groups,
      waiting: 0,
      ouRoot: this.props.ouRoot,
      renderListGroups:true,
      renderChart:false          
    })
   // let filtered = this.filterGroups(groups);
    //let arrUg=Object.keys(filtered)
    // for (let ug of arrUg ) {
    //   this.getGroupLoginStats(ug).then(res => {
    //     filtered[ug]['data'] = res;
    //     if(arrUg[arrUg.length-1]==ug){
    //       this.setState({
    //         userGroupsFiltered: filtered,
    //         userGroups: this.props.groups,
    //         waiting: 0,
    //         renderListGroups:true,
    //         renderChart:false          
    //       })
    //     }        
    //   });
    // }
  },

  //update how they want to filter the data
  handleFilterByChange(filterBy, value,displayNameSelected) {
    //toggle the search children box if they switch from group to ou
     this.setState({
        filterBy,displayNameSelected
      })

  
      this.setState({userGroupsFiltered:{}})
      

      if (this.state.filterBy === 'ou') {
        this.handleFilterChangeOU(filterBy, value,displayNameSelected)
      }
      else{
        this.handleFilterChangeUserGRoup(filterBy, value);
      }
  },
  handleFilterChangeOU(filterBy, value,displayNameSelected){
    if(value==null || value==undefined)
      return 0
    if(value.length>0)
      this.setState({processing: false,renderChart: false,selectedOU:value});
    else
      this.setState({processing: true,renderChart: false,selectedOU:value});
    //var filtered = this.state.userGroupsFiltered;
    var filtered=[]
    value.forEach((ouPath,index)=>{
      var uidsPath=ouPath.split("/")
      var OUID=uidsPath[uidsPath.length-1] 
      this.getOULoginStats(OUID).then(res=>{
        //if already there exist the uid then delete it from filter selected
        // if(filtered[OUID]){
        //   delete filtered[OUID]
        // }
        // else{
            filtered[OUID] = {
              data: res,
              id: OUID,
              displayName: displayNameSelected[index],
            };
       // }
        console.log(filtered)
        //console.log(Object.keys(filtered).length);
        this.setState({
          userGroupsFiltered: filtered,
          waiting: this.state.waiting - 1,
          processing:false,
          renderChart: false
        })
      })
    })
      
    this.setState({ filter: value, filterBy: filterBy});

  },
   //want to show a specific User group or org here
  handleFilterChangeUserGRoup(filterBy, value) {
    //console.log("CUSTOM CHART:", value);
    //disable the button when is processing request
    this.setState({processing: true,renderChart: false});
    
    if (filterBy === 'group' && value !== null) {
      //this.setState({ waiting: this.state.waiting + 1 });

      this.getGroupLoginStats(value).then(res => {
        //console.log('res', res, filtered);

        let filtered = this.state.selectedOU;
        //if already there exist the uid then delete it from filter selected
        if(filtered[value]){
          delete filtered[value]
        }
        else{
            filtered[value] = {
              data: res,
              id: value,
              displayName: this.state.userGroups[value].displayName,
            };
        }
       //console.log(Object.keys(filtered).length);
       this.setState({
         userGroupsFiltered: filtered,
         waiting: this.state.waiting - 1,
         processing:false,
         renderChart: false
       })
      });
    }
  },
    //Include Child OUs checkbox
    handleFilterChildOUs(event, value) {
      this.setState({ searchChildOUs: value });
      this.handleFilterChangeOU("ou",this.state.selectedOU,this.state.displayNameSelected)

    },
  // async getChildOUs(value) {
  //   if (this.state.filterBy === 'ou' && this.state.searchChildOUs === true && this.state.ouRoot.id !== this.state.filter && this.state.filter !== null) {
  //     this.setState({ processing: true });
  //     this.getOrgChildren(value).then(children => {
  //       console.log(children)
  //       this.setState({ orgChildren: children, processing: false });
  //     });
  //   }
  // },

  //recursively find all children of id. return array of IDs
  // async getOrgChildrenAnt(id) {
  //   const d2 = this.props.d2;
  //   let nodes = [id];
  //   let m = await d2.models.organisationUnits.get(id);
  //   if (m.id === id) {
  //     if (m.hasOwnProperty('children') && m.children !== undefined) {
  //       if (m.children.size === 0) {
  //         return nodes;
  //       }
  //       for (let child of m.children) {
  //         let c = await this.getOrgChildren(child[0]);
  //         nodes = nodes.concat(c);
  //       }
  //       return nodes;
  //     }
  //     else {   //other way to get no children
  //       return nodes;
  //     }
  //   }
  //   return nodes;
  // },
    //recursively find all children of id. return array of IDs
    // async getOrgChildren(id) {
    //   const d2 = this.props.d2;
    //  const api = d2.Api.getApi();     
    //  const resource="users"  
    //  const param="filter=userCredentials.disabled:eq:false&filter=organisationUnits.path:like:"+id+"&fields=id,userCredentials[lastLogin,created]"    
    //  let res={};
    //  res = await api.get('/' + resource+"?"+param);
    //  return res.users.map(user => user.id);
    //   //return nodes;
    // },

  //get the UID for our secret sauce attribute
  // getAttributeID() {
  //   if (this.state.attributeID !== '') {
  //     return this.state.attributeID;
  //   }
  //   for (let a of Object.keys(this.props.attribs)) {
  //     if (this.props.attribs[a] === DASH_USERGROUPS_CODE) {
  //       this.setState({ attributeID: a,renderChart: false });
  //       return a;
  //     }
  //   }
  //   return '';
  // },
  //filter out all non FILTER attributed groups
  // filterGroups(groups) {
  //   //find the user group attrib ID for displayable UserGroups on the dashboard
  //   let attributeID = this.getAttributeID();

  //   //only keep the groups that are in our DASH_USERGROUPS_CODE
  //   let g = {};
  //   for (let ug of Object.keys(groups)) {
  //     if (groups[ug].hasOwnProperty('attributeValues')) {
  //       for (let attr in groups[ug].attributeValues) {
  //         if (groups[ug].attributeValues[attr].attribute.id === attributeID) {
  //           if (groups[ug].attributeValues[attr].value === 'true') {
  //             g[ug] = groups[ug];
  //           }
  //         }
  //       }
  //     }
  //   }
  //   return g;
  // },

  async getGroupLoginStats(groupID) {
    let res = {};
    let previous = 0;
    for (let d in loginStatusRanges) {
      let count = await this.getRecentLoginStats(groupID, false, loginStatusRanges[d]);
      let prop = loginStatusRanges[d];
      if (prop === 'Older' || prop==='None') {
        if(prop==='Older')
          res[prop] = (count - previous);
        else 
          res[prop] = (res[prop]>=0?count+ res[prop]:count);
      }
      else {
          res[prop + ' days'] = (count - previous);        
        
      }
      previous = count;
    }
    return res;
  },

  //Find total users in group/ou
  async getRecentLoginStats(groupID, ou, days) {
    try {
      var noneCount=0;
      const d2 = this.props.d2;
      const api = d2.Api.getApi();
      let search = {
        fields: 'id,userCredentials[lastLogin,created]',
        pageSize: 1,
      };
      if (days !== 'Older' &&  days!='None') {
        var d = new Date();
        d.setDate(d.getDate() - days);
        search.lastLogin = d.toISOString().substr(0, 10);
      }
      search.filter = ['userCredentials.disabled:eq:false'];
      if (groupID !== false) {
        search.filter.push('userGroups.id:eq:' + groupID);
      }
      if (ou !== false) {
        search.ou = ou;
      }
      
      let u = await api.get('users', search);
      if(days=='None'){
        for (let resp of u.users){
          if(resp.userCredentials.lastLogin==resp.userCredentials.created){
            noneCount++;
          }
        };
        return noneCount;
      }else{
      if (u.hasOwnProperty('pager') && u.pager.hasOwnProperty('total')) {
        return u.pager.total;
      }
    }
    }
    catch (e) {
      console.error("Stat lookup failure:", groupID, ou, days, e);
    }
    return 0;
  },

  //ou
  
  async getOULoginStats(OUID) {
    let res = {};
    let previous = 0;   
    for (let d in loginStatusRanges) {
        let count = await this.getRecentLoginStatsByOU(OUID, false, loginStatusRanges[d]);
        let prop = loginStatusRanges[d];
        if (prop === 'Older' || prop==='None') {
          if(prop==='Older')
            res[prop] = (count - previous);
          else 
            res[prop] = (res[prop]>=0?count+ res[prop]:count);
        }
        else {
            res[prop + ' days'] = (count - previous);        
          
        }
        previous = count;
    } 
    return res;
  },

  //Find total users in group/ou
  async getRecentLoginStatsByOU(OUID, ou, days) {
    if (OUID ==undefined || OUID==null) {
        return 0
    }
    try {
      var noneCount=0;
      const d2 = this.props.d2;
      const api = d2.Api.getApi();
      let search = {
        fields: 'id,userCredentials[lastLogin,created]',
        pageSize: 1,
      };
      if (days !== 'Older' &&  days!='None') {
        var d = new Date();
        d.setDate(d.getDate() - days);
        search.lastLogin = d.toISOString().substr(0, 10);
      }
      search.filter = ['userCredentials.disabled:eq:false'];
      
      if(this.state.searchChildOUs==true)
        search.filter.push('organisationUnits.path:like:' + OUID);
      else
        search.filter.push('organisationUnits.id:eq:' + OUID);
      
      if (ou !== false) {
        search.ou = ou;
      }
      
      let u = await api.get('users', search);
      if(days=='None'){
        for (let resp of u.users){
          if(resp.userCredentials.lastLogin==resp.userCredentials.created){
            noneCount++;
          }
        };
        return noneCount;
      }else{
            if (u.hasOwnProperty('pager') && u.pager.hasOwnProperty('total')) {
              return u.pager.total;
            }
    }
    }
    catch (e) {
      console.error("Stat lookup failure:", OUID, ou, days, e);
    }
    return 0;
  },
  async getOuRoot(userfilter) {
    const d2 = this.props.d2;
    const api = d2.Api.getApi();
    try {
      //get OU tree rootUnit
      let search={
        fields:"id,path",
        withinUserHierarchy:true,
        pageSize:15,
        query:userfilter
    }
      let rootLevel = await api.get('organisationUnits', search);
      if (rootLevel.organisationUnits!=undefined) {
        return rootLevel.organisationUnits;
      }
    }
    catch (e) {
      console.error('Could not access userGroups from API');
    }
    return undefined;
  },
  
  //

   rendercomponents(){

    const d2 = this.props.d2;
    let options_groups = {
      colors: loginStatusColors,
      chart: { type: 'bar', },
      title: { text: 'Login Status by Group' },
      xAxis: { categories: [], title: { text: 'User Group' }, },
      yAxis: { min: 0, title: { text: '% of users who have logged in within X days' } },
      legend: { reversed: false },
      tooltip: {
        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
        shared: true
      },
      plotOptions: { series: { stacking: 'percent' } },
      series: []
    };
    let options_ou = {
      colors: loginStatusColors,
      chart: { type: 'bar', },
      title: { text: 'Login Status by Organisation Unit' },
      xAxis: { categories: [], title: { text: 'Organisation Units' }, },
      yAxis: { min: 0, title: { text: '% of users who have logged in within X days' } },
      legend: { reversed: false },
      tooltip: {
        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
        shared: true
      },
      plotOptions: { series: { stacking: 'percent' } },
      series: []
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

    <div className='container'>
  
    <Paper className='item'>
      <p>{d2.i18n.getTranslation("app_ttl_filterUser")}</p>
      {/* <FilterGroups value={this.state.filterBy}
        onFilterChange={this.handleFilterChange}
        groups={this.props.groups}
        groupsfiltered={this.state.userGroupsFiltered}
        disabled={this.state.processing}
        clearSelected={this.clearAllSelected}
      /> */}
        <FilterBy 
        value={this.state.filterBy}
        onFilterChange={this.handleFilterByChange}
        groups={this.state.userGroups}
        ouRoot={this.props.ouRoot}
        multiselect={true}
        changeRoot={this.getOuRoot}
       />
       {(this.state.filterBy != 'ou' || this.state.ouRoot.id === this.state.filter)?"":
        <CheckboxUI 
        label={d2.i18n.getTranslation("app_lbl_filter_include_child_ou")}
        checked={this.state.searchChildOUs}
        onCheck={this.handleFilterChildOUs}
        disabled={this.state.filterBy != 'ou' || this.state.ouRoot.id === this.state.filter || this.state.selectedOU.length<1}
        labelStyle={{ color: 'grey', fontSize: 'small' }} 
        />}
      <div style={{height:35}}></div>
      <RaisedButton
        label={d2.i18n.getTranslation("app_btn_update")}
        labelPosition="before"
        primary={true}
        disabled={this.state.processing}
        onClick={this.seeReport}
        icon={<FontIcon className="material-icons">refresh</FontIcon>}
        style={{ 'clear': 'both' }}
      />
      {this.state.processing?<CircularProgress size={1} style={{ float: 'right' }} />:""}

    </Paper>

    <Paper className='item'>
      {this.state.filterBy != 'ou'?
      <ChartLogins container='chartGroups' options={options_groups} groups={this.state.userGroupsFiltered} renderChart={this.state.renderChart}/>
      :<ChartLogins container='chartGroups' options={options_ou} groups={this.state.userGroupsFiltered} renderChart={this.state.renderChart}/>}
      
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
