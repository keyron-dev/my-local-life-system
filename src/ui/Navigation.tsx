import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import HomeScreen from './screens/HomeScreen'
import InboxScreen from './screens/InboxScreen'
import BacklogScreen from './screens/BacklogScreen'
import ProjectsScreen from './screens/ProjectsScreen'
import IdeasScreen from './screens/IdeasScreen'
import NotesScreen from './screens/NotesScreen'
import SomedayScreen from './screens/SomedayScreen'
import DelegatedScreen from './screens/DelegatedScreen'
import DoneScreen from './screens/DoneScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function ListsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Backlog" component={BacklogScreen} />
      <Stack.Screen name="Projects" component={ProjectsScreen} />
      <Stack.Screen name="Ideas" component={IdeasScreen} />
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="Someday" component={SomedayScreen} />
      <Stack.Screen name="Delegated" component={DelegatedScreen} />
      <Stack.Screen name="Done" component={DoneScreen} />
    </Stack.Navigator>
  )
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Inbox" component={InboxScreen} />
        <Tab.Screen name="Lists" component={ListsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
