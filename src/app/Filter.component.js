import React from 'react';

import OrgUnitTree from 'd2-ui/lib/org-unit-tree/OrgUnitTree.component';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import FilterGroup from './Filter.UserGroup.component.js';
import TextField from 'material-ui/TextField';
// TODO: Rewrite as ES6 class
/* eslint-disable react/prefer-es6-class */
export default React.createClass({

    propTypes: {
        d2: React.PropTypes.object,
        groups: React.PropTypes.object.isRequired,
        ouRoot: React.PropTypes.object.isRequired,
        onFilterChange: React.PropTypes.func.isRequired,
        //disabledFilter: React.PropTypes.func.isRequired,

    },

    contextTypes: {
        d2: React.PropTypes.object,
    },

    getInitialState() {
        return {
          filterBy:'none', 
          filterOU:[],
          filterName:"",
          filter:null,   // none, group, ou
          selected:[],
          ouRoot:null,        // top of the OU tree, needed for OrgUnitTree
          userGroups:{},      // all user groups, needed for filter
          disabledFilter:true,
          userGroupsFiltered: {},
          processing:false,
          DisplayNameSelected:[]
        };
    },

    //make sure we have our necessary select box data
    componentDidMount() {
      let our = null;
      if (this.props.hasOwnProperty('ouRoot')){
        our = this.props.ouRoot;
      }
         this.setState({
        userGroups:this.props.groups,
        ouRoot:our,
        disabledFilter:this.props.disabledFilter
      });
    },

    //group and OU root data from App.js
    componentWillReceiveProps(nextProps) {
      let our = null;
      if (nextProps.hasOwnProperty('ouRoot')){
        our = nextProps.ouRoot;
      }
      this.setState({
        filterBy:nextProps.value,
        userGroups:nextProps.groups,
        ouRoot:our,
        disabledFilter:nextProps.disabledFilter
      });
    },
    clearAllSelected(){
      this.setState({userGroupsFiltered:{}});
      this.props.onFilterChange('none',null);
    },
    //update how they want to filter the data
    handleFilterChange(event, index, value){
      this.setState({selected:[],filterBy:value});
      this.props.onFilterChange(value,null);
    },
    handleFilterChangeGroups(filterby, value){
        this.props.onFilterChange(filterby, value);
    },

    //Clicking on the org tree
    handleSelectedOrgUnitAnt(event, model) {
      if (this.state.ouRoot.id===model.id){
        return;
      }
      this.setState({
          filter: [(model.id === this.state.filter[0])?[]:model.path],
      });
      this.props.onFilterChange(this.state.filterBy,(model.id === this.state.filter)?null:model.id);
    },

    handleSelectedOrgUnit(event, orgUnit) {
      var selected=this.state.selected
      var DisplayNameSelected=this.state.DisplayNameSelected

      if(this.props.multiselect!=true){
        
            if (selected[0] === orgUnit.path) {
              selected=[]             
              DisplayNameSelected=[]
            }
            else{
              selected=[orgUnit.path] 
              DisplayNameSelected=[orgUnit.displayName]
            }
      }
      else{
          if (selected.includes(orgUnit.path)) {    
              selected.splice(selected.indexOf(orgUnit.path), 1);  
              DisplayNameSelected.splice(DisplayNameSelected.indexOf(orgUnit.displayName), 1);              
          } else {
              selected.push(orgUnit.path);    
              DisplayNameSelected.push(orgUnit.displayName)     
          }          
      }
      //this.props.onFilterChange(this.state.filterBy,(orgUnit.id === this.state.selected[0])?null:orgUnit.id);
      this.props.onFilterChange(this.state.filterBy,selected,DisplayNameSelected)
      this.setState({selected,DisplayNameSelected});
  },


    //Clicking on the org tree
    handleGroupChange(event, index, value) {
      this.setState({
          filter: value,
      });
      this.props.onFilterChange(this.state.filterBy,value);
    },
      //get the top of the OU tree
    async searchByName(event, newValue){
       let nroot= await this.props.changeRoot(newValue)
       var filterOU= nroot.map(ou=>{
         return ou.path
       })
       this.setState({filterName:newValue,filterOU:filterOU})      
      },
    //Show the OU tree if that is the current filter
    getOUTree(){
      const selStyle = {
        borderTop: '1px solid #eeeeee',
        margin: '16px -16px 0',
        padding: '16px 16px 0',
      };
      if (this.state.filterBy === 'ou'){
          return (
            <div>
              <TextField
            hintText="Write here the OU name"
            floatingLabelText="Seach by name"
            floatingLabelFixed={true}
            onChange={this.searchByName}
            value={this.state.filterName}
          />
            <div style={{height:'150px',overflowY:'scroll'}}>
            <OrgUnitTree
              root={this.state.filterOU.length==0&&this.state.filterName!=""?{}:this.state.ouRoot}
              onSelectClick={this.handleSelectedOrgUnit}
              selected={this.state.selected}
              hideCheckboxes 
              orgUnitsPathsToInclude={this.state.filterOU}             
            />   </div>
            {/* 
             
            {this.props.multiselect?
            
             <div style={selStyle}>
                    <TreeView label={`Selected: ${this.state.selected.length}`}>
                        <ul>{
                            this.state.selected
                                .sort()
                                .map(i => <li key={i}>{i}</li>)
                        }</ul>
                    </TreeView>
                </div>
                 :""} */}
            </div>
           
         
          );
      }
      return null;
    },

    //Show the available User groups
    getUserGroups(){
      if (this.state.filterBy === 'group'){
        return (
          <FilterGroup value={this.state.filterBy}
          onFilterChange={this.handleFilterChangeGroups}
          groups={this.props.groups}
          groupsfiltered={this.state.userGroupsFiltered}
          disabled={this.state.processing}
          clearSelected={this.clearAllSelected}
        />
        );
      }
      return null;
    },

    render() {
        return (
          <div>
            <SelectField  value={this.state.filterBy}
                          onChange={this.handleFilterChange}
                          floatingLabelText='Select Type'
                          maxHeight={200}
                          autoWidth={true}
                          disabled={this.state.disabledFilter}>
              <MenuItem value='none' key='none' primaryText='-' />
              <MenuItem value='group' key='group' primaryText='User Group' />
              {this.props.ouRoot!=null?(
                <MenuItem value='ou' key='ou' primaryText='Organizational Unit' />
              ):<span/>}
            </SelectField>
            <div>
              {this.getOUTree()}
              {this.getUserGroups()}
              {(this.state.filterBy === 'none'?<div><div style={{height:'150px',overflowY:'scroll'}}></div></div>:"")}
            </div>
          </div>
        );
    },
});
