import { createSlice } from '@reduxjs/toolkit'

// Simplified keyword mapping slice - will be migrated fully later
const keywordMappingSlice = createSlice({
  name: 'keywordMappings',
  initialState: {
    mappings: [],
    loading: false,
    error: null,
  },
  reducers: {},
})

export default keywordMappingSlice.reducer
