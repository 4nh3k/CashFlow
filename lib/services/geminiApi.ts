import { GoogleGenerativeAI } from '@google/generative-ai'
import type { KeywordMapping } from '@/types/llm'

export interface TransactionExtraction {
  amount: number
  type: 'income' | 'expense'
  description: string
  suggestedCategory: string | undefined
  confidence: number
}

class GeminiApiService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null

  constructor() {
    this.initializeModel()
  }

  private initializeModel() {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn(
        'Gemini API key not configured. AI features will use fallback parsing.'
      )
      return
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error)
    }
  }

  async parseTransactionInput(input: string): Promise<TransactionExtraction> {
    // If no model available, use fallback
    if (!this.model) {
      return this.fallbackParse(input)
    }

    const prompt = `
    Parse this Vietnamese transaction input and extract:
    1. Amount (convert "k" or "nghìn" to thousands, "triệu" to millions, e.g., "50k" = 50000, "2 triệu" = 2000000)
    2. Type (income or expense based on keywords like "chi", "thu", "nhận", "trả")
    3. Description (clean description of the transaction)
    4. Suggested category if clear from context

    Vietnamese Transaction Input: "${input}"

    Common Vietnamese categories:
    - "Food & Dining" for: ăn, cafe, nhà hàng, quán, cơm, phở
    - "Transportation" for: xe bus, grab, taxi, xăng, xe ôm
    - "Entertainment" for: phim, game, bida, karaoke, bar
    - "Shopping" for: mua sắm, quần áo, giày dép, đồ điện tử
    - "Healthcare" for: thuốc, bác sĩ, bệnh viện, khám
    - "Education" for: học phí, sách, khóa học
    - "Utilities" for: điện, nước, internet, gas, điện thoại
    - "Salary" for: lương, thưởng
    - "Other Income" for: thu nhập khác

    Respond with ONLY valid JSON in this exact format:
    {
      "amount": number,
      "type": "income" | "expense", 
      "description": "string",
      "suggestedCategory": "string or null",
      "confidence": number (0-1)
    }

    Examples:
    Input: "chi 50k cafe" 
    Output: {"amount": 50000, "type": "expense", "description": "cafe", "suggestedCategory": "Food & Dining", "confidence": 0.9}

    Input: "thu 2 triệu lương"
    Output: {"amount": 2000000, "type": "income", "description": "lương", "suggestedCategory": "Salary", "confidence": 0.95}
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid response format')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate the response
      if (
        typeof parsed.amount !== 'number' ||
        !['income', 'expense'].includes(parsed.type) ||
        typeof parsed.description !== 'string'
      ) {
        throw new Error('Invalid response structure')
      }

      // Set default confidence if not provided or invalid
      if (typeof parsed.confidence !== 'number') {
        parsed.confidence = 0.8
      }

      return parsed
    } catch (error) {
      console.error('Error parsing transaction input:', error)
      // Fallback parsing
      return this.fallbackParse(input)
    }
  }

  private fallbackParse(input: string): TransactionExtraction {
    const text = input.toLowerCase().trim()

    // Extract amount
    let amount = 0
    const amountMatches = text.match(
      /(\d+(?:[.,]\d+)?)\s*(k|nghìn|triệu|tr|trieu)?/
    )
    if (amountMatches && amountMatches[1]) {
      const num = parseFloat(amountMatches[1].replace(',', '.'))
      const unit = amountMatches[2]

      if (unit === 'k' || unit === 'nghìn') {
        amount = num * 1000
      } else if (unit === 'triệu' || unit === 'tr' || unit === 'trieu') {
        amount = num * 1000000
      } else {
        amount = num
      }
    }

    // Determine type based on Vietnamese keywords
    const isIncome =
      text.includes('thu') ||
      text.includes('nhận') ||
      text.includes('lương') ||
      text.includes('receive') ||
      text.includes('income') ||
      text.includes('salary')

    const type = isIncome ? 'income' : 'expense'

    // Basic category suggestion based on keywords
    let suggestedCategory = null
    if (
      text.includes('cafe') ||
      text.includes('ăn') ||
      text.includes('cơm') ||
      text.includes('phở')
    ) {
      suggestedCategory = 'Food & Dining'
    } else if (
      text.includes('grab') ||
      text.includes('taxi') ||
      text.includes('xe') ||
      text.includes('xăng')
    ) {
      suggestedCategory = 'Transportation'
    } else if (
      text.includes('phim') ||
      text.includes('game') ||
      text.includes('bida')
    ) {
      suggestedCategory = 'Entertainment'
    } else if (text.includes('lương') || text.includes('salary')) {
      suggestedCategory = 'Salary'
    }

    return {
      amount,
      type,
      description: input.trim(),
      suggestedCategory: suggestedCategory || undefined,
      confidence: 0.5,
    }
  }

  async suggestCategoryForDescription(
    description: string,
    existingKeywords: KeywordMapping[] = []
  ): Promise<string | null> {
    // First check existing keyword mappings
    const matchingKeyword = existingKeywords.find(mapping =>
      description.toLowerCase().includes(mapping.keyword.toLowerCase())
    )

    if (matchingKeyword) {
      return matchingKeyword.categoryId
    }

    // If no model available, return null
    if (!this.model) {
      return null
    }

    const prompt = `
    Suggest a category for this Vietnamese transaction description.
    
    Description: "${description}"
    
    Available categories (respond with exact name):
    - Food & Dining
    - Transportation  
    - Entertainment
    - Shopping
    - Healthcare
    - Education
    - Utilities
    - Salary
    - Other Income
    - Uncategorized
    
    Consider Vietnamese context and keywords. Respond with ONLY the category name or "null" if unclear.
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const category = response.text().trim().replace(/['"]/g, '')

      return category === 'null' ? null : category
    } catch (error) {
      console.error('Error suggesting category:', error)
      return null
    }
  }

  async generateKeywordSuggestions(description: string): Promise<string[]> {
    // If no model available, return basic keywords
    if (!this.model) {
      return [description.toLowerCase()]
    }

    const prompt = `
    Extract meaningful keywords from this Vietnamese transaction description that could be used for future categorization.
    
    Description: "${description}"
    
    Return 1-3 relevant keywords as a JSON array. Focus on:
    - Specific places/vendors (cafe, grab, etc.)
    - Activity types (ăn, uống, mua, etc.)
    - Product categories (điện thoại, áo, etc.)
    
    Respond with ONLY a JSON array of strings: ["keyword1", "keyword2", "keyword3"]
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text().trim()

      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return [description.toLowerCase()]
      }

      const keywords = JSON.parse(jsonMatch[0])
      return Array.isArray(keywords) ? keywords : [description.toLowerCase()]
    } catch (error) {
      console.error('Error generating keyword suggestions:', error)
      return [description.toLowerCase()]
    }
  }

  async generateFinancialInsights(
    transactions: any[],
    categories: any[]
  ): Promise<string> {
    // If no model available, return basic insight
    if (!this.model) {
      return 'AI insights are not available. Please configure your Gemini API key to enable intelligent financial analysis.'
    }

    const prompt = `
    Analyze this financial data and provide insights in Vietnamese:
    
    Transactions: ${JSON.stringify(transactions.slice(-10))} // Last 10 transactions
    Categories: ${JSON.stringify(categories)}
    
    Provide insights about:
    1. Spending patterns
    2. Budget recommendations
    3. Unusual activities
    4. Savings opportunities
    
    Respond in Vietnamese, maximum 200 words, be helpful and specific.
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text().trim()
    } catch (error) {
      console.error('Error generating financial insights:', error)
      return 'Không thể tạo thông tin chi tiết tài chính lúc này. Vui lòng thử lại sau.'
    }
  }

  async generateChatResponse(
    userMessage: string,
    financialContext: {
      categories: any[]
      wallets: any[]
      recentTransactions: any[]
      conversationHistory?: any[]
      [key: string]: any
    }
  ): Promise<{
    message: string
    actionType?: 'create_transaction' | 'create_category' | 'create_wallet' | 'create_budget' | 'financial_insight'
    actionData?: any
    confidence?: number
  }> {
    // If no model available, use fallback
    if (!this.model) {
      return this.fallbackChatResponse(userMessage, financialContext)
    }

    const prompt = `
    You are a Vietnamese financial assistant chatbot. Respond naturally in Vietnamese to help users manage their finances.

    User Message: "${userMessage}"
    Conversation History: ${JSON.stringify(financialContext.conversationHistory || [])}

    Available Financial Data:
    - Categories: ${JSON.stringify(financialContext.categories)}
    - Wallets: ${JSON.stringify(financialContext.wallets)}
    - Recent Transactions: ${JSON.stringify(financialContext.recentTransactions.slice(-5))}

    IMPORTANT VALIDATION RULES:
    1. For budgets: ONLY create action if both categoryId AND amount AND period are clearly specified
    2. For transactions: ONLY create action if amount is clearly specified
    3. For categories/wallets: ONLY create action if name is clearly specified
    4. If missing critical information, ASK for it instead of creating incomplete action

    Instructions:
    1. If user wants to create a transaction (keywords: "ăn", "mua", "chi", "thu", "nhận", amounts like "50k", "100 nghìn"), respond with helpful confirmation and extract transaction details
    2. If user wants to create category/wallet/budget, help them with that BUT validate all required fields first
    3. If user asks for insights, provide financial analysis
    4. Always respond in natural Vietnamese conversation style
    5. Use conversation history to maintain context

    Response format (JSON):
    {
      "message": "Vietnamese response message",
      "actionType": "create_transaction|create_category|create_wallet|create_budget|financial_insight|null",
      "actionData": {
        // For create_transaction:
        "amount": number (REQUIRED),
        "description": "string (REQUIRED)", 
        "type": "income|expense (REQUIRED)",
        "categoryId": "category_id",
        "walletId": "wallet_id",
        "suggestedWallet": "wallet_name",
        "suggestedCategory": "category_name"
        // For create_category:
        "name": "string (REQUIRED)",
        "defaultType": "income|expense",
        "color": "hex_color"
        // For create_wallet:
        "name": "string (REQUIRED)",
        "balance": number
        // For create_budget: ALL FIELDS REQUIRED
        "categoryId": "string (REQUIRED - must be valid category)",
        "amount": number (REQUIRED),
        "period": "monthly|weekly (REQUIRED)"
      },
      "confidence": 0.1-1.0
    }

    BUDGET EXAMPLES:
    User: "Tạo ngân sách ăn uống 100k/ngày"
    Response: {
      "message": "Bạn muốn tạo ngân sách ăn uống 100.000 VNĐ/ngày phải không? Mình cần biết thêm thông tin:\\n\\n� Chu kỳ ngân sách: Bạn muốn thiết lập theo tuần hay tháng?\\n💳 Áp dụng cho ví nào?\\n\\nVí dụ: 'Tạo ngân sách ăn uống 700k/tuần' hoặc 'Tạo ngân sách ăn uống 3 triệu/tháng'",
      "actionType": null,
      "confidence": 0.8
    }

    User: "Tạo ngân sách ăn uống 700k/tuần"
    Response: {
      "message": "Tôi sẽ giúp bạn tạo ngân sách ăn uống 700.000 VNĐ/tuần:\\n\\n📊 Ngân sách: 700.000 VNĐ\\n📅 Chu kỳ: Hàng tuần\\n🏷️ Danh mục: Ăn uống\\n\\nBạn có muốn tạo ngân sách này không?",
      "actionType": "create_budget",
      "actionData": {
        "categoryId": "Ăn uống",
        "amount": 700000,
        "period": "weekly"
      },
      "confidence": 0.95
    }

    TRANSACTION EXAMPLES:
    User: "Ăn tối 50k"
    Response: {
      "message": "Tôi sẽ giúp bạn tạo giao dịch ăn tối 50.000 VNĐ:\\n\\n💰 Số tiền: 50.000 VNĐ\\n� Mô tả: Ăn tối\\n�️ Danh mục: Ăn uống\\n💳 Ví: Ví chính\\n\\nBạn có muốn tạo giao dịch này không?",
      "actionType": "create_transaction",
      "actionData": {
        "amount": 50000,
        "description": "Ăn tối",
        "type": "expense",
        "suggestedCategory": "Ăn uống",
        "suggestedWallet": "Ví chính"
      },
      "confidence": 0.9
    }
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid response format')
      }

      const parsed = JSON.parse(jsonMatch[0])
      return {
        message: parsed.message || 'Xin lỗi, tôi không hiểu yêu cầu của bạn.',
        actionType: parsed.actionType || undefined,
        actionData: parsed.actionData || undefined,
        confidence: parsed.confidence || 0.5
      }
    } catch (error) {
      console.error('Error generating chat response:', error)
      return this.fallbackChatResponse(userMessage, financialContext)
    }
  }

  private fallbackChatResponse(
    userMessage: string,
    financialContext: any
  ): {
    message: string
    actionType?: 'create_transaction' | 'create_category' | 'create_wallet' | 'create_budget' | 'financial_insight'
    actionData?: any
    confidence?: number
  } {
    const text = userMessage.toLowerCase().trim()

    // Check for budget creation - must have amount and period clearly specified
    if (text.includes('ngân sách') || text.includes('budget')) {
      const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|nghìn|triệu|tr|trieu)?/)
      const periodMatch = text.match(/(tuần|tháng|ngày|weekly|monthly|week|month)/)
      
      if (!amountMatch) {
        return {
          message: 'Để tạo ngân sách, bạn cần cho mình biết số tiền. Ví dụ: "Tạo ngân sách ăn uống 500k/tháng"',
          confidence: 0.8
        }
      }

      if (!periodMatch) {
        return {
          message: 'Bạn muốn tạo ngân sách theo chu kỳ nào? Hãy nói rõ "tuần" hoặc "tháng". Ví dụ: "Tạo ngân sách ăn uống 500k/tháng"',
          confidence: 0.8
        }
      }

      const num = parseFloat(amountMatch[1].replace(',', '.'))
      const unit = amountMatch[2]

      let amount = num
      if (unit === 'k' || unit === 'nghìn') {
        amount = num * 1000
      } else if (unit === 'triệu' || unit === 'tr' || unit === 'trieu') {
        amount = num * 1000000
      }

      // Convert daily to weekly/monthly
      if (text.includes('ngày') || text.includes('day')) {
        if (text.includes('tuần') || text.includes('week')) {
          amount = amount * 7 // Daily to weekly
        } else {
          amount = amount * 30 // Daily to monthly (default to monthly)
        }
      }

      const period = (text.includes('tuần') || text.includes('weekly') || text.includes('week')) ? 'weekly' : 'monthly'
      const periodVN = period === 'weekly' ? 'hàng tuần' : 'hàng tháng'

      // Try to find category
      let categoryName = 'Chưa xác định'
      if (text.includes('ăn uống') || text.includes('ăn') || text.includes('food')) {
        categoryName = 'Ăn uống'
      } else if (text.includes('du lịch') || text.includes('travel')) {
        categoryName = 'Du lịch'
      } else if (text.includes('mua sắm') || text.includes('shopping')) {
        categoryName = 'Mua sắm'
      }

      // Check if category exists
      const category = financialContext.categories.find((cat: any) => 
        cat.name.toLowerCase().includes(categoryName.toLowerCase()) ||
        categoryName.toLowerCase().includes(cat.name.toLowerCase())
      )

      if (!category && categoryName === 'Chưa xác định') {
        return {
          message: `Bạn muốn tạo ngân sách ${amount.toLocaleString('vi-VN')} VNĐ/${periodVN} cho danh mục nào?\n\nDanh mục hiện có: ${financialContext.categories.map((c: any) => c.name).join(', ')}\n\nVí dụ: "Tạo ngân sách ăn uống ${amount.toLocaleString('vi-VN')} VNĐ/${periodVN}"`,
          confidence: 0.7
        }
      }

      return {
        message: `Tôi sẽ giúp bạn tạo ngân sách ${amount.toLocaleString('vi-VN')} VNĐ cho danh mục "${category?.name || categoryName}" với chu kỳ ${periodVN}:\n\n📊 Ngân sách: ${amount.toLocaleString('vi-VN')} VNĐ\n📅 Chu kỳ: ${periodVN.charAt(0).toUpperCase() + periodVN.slice(1)}\n🏷️ Danh mục: ${category?.name || categoryName}\n\nBạn có muốn tạo ngân sách này không?`,
        actionType: 'create_budget',
        actionData: {
          categoryId: category?.id || category?.name || categoryName,
          amount,
          period
        },
        confidence: 0.85
      }
    }

    // Check for transaction creation
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|nghìn|triệu|tr|trieu)?/)
    if (amountMatch && (text.includes('ăn') || text.includes('mua') || text.includes('chi') || text.includes('thu'))) {
      const num = parseFloat(amountMatch[1].replace(',', '.'))
      const unit = amountMatch[2]

      let amount = num
      if (unit === 'k' || unit === 'nghìn') {
        amount = num * 1000
      } else if (unit === 'triệu' || unit === 'tr' || unit === 'trieu') {
        amount = num * 1000000
      }

      const isIncome = text.includes('thu') || text.includes('nhận')
      const type = isIncome ? 'income' : 'expense'

      return {
        message: `Tôi sẽ giúp bạn tạo giao dịch ${amount.toLocaleString('vi-VN')} VNĐ:\n\n💰 Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ\n📝 Mô tả: ${userMessage}\n💳 Loại: ${type === 'income' ? 'Thu nhập' : 'Chi tiêu'}\n\nBạn có muốn tạo giao dịch này không?`,
        actionType: 'create_transaction',
        actionData: {
          amount,
          description: userMessage,
          type,
          suggestedCategory: 'Chưa phân loại',
          suggestedWallet: financialContext.wallets[0]?.name || 'Ví chính'
        },
        confidence: 0.7
      }
    }

    // Check for category creation
    if (text.includes('tạo danh mục') || text.includes('danh mục mới')) {
      const categoryName = text.replace(/tạo danh mục|danh mục mới|cho/g, '').trim()
      if (!categoryName) {
        return {
          message: 'Bạn muốn tạo danh mục với tên gì? Ví dụ: "Tạo danh mục du lịch"',
          confidence: 0.8
        }
      }
      return {
        message: `Tôi sẽ giúp bạn tạo danh mục mới "${categoryName}":\n\n🏷️ Tên: ${categoryName}\n💸 Loại: Chi tiêu\n\nBạn có muốn tạo danh mục này không?`,
        actionType: 'create_category',
        actionData: {
          name: categoryName,
          defaultType: 'expense',
          color: '#3B82F6'
        },
        confidence: 0.8
      }
    }

    // Check for wallet creation
    if (text.includes('tạo ví') || text.includes('ví mới')) {
      const walletName = text.replace(/tạo ví|ví mới/g, '').trim()
      if (!walletName) {
        return {
          message: 'Bạn muốn tạo ví với tên gì? Ví dụ: "Tạo ví tiết kiệm"',
          confidence: 0.8
        }
      }
      return {
        message: `Tôi sẽ giúp bạn tạo ví mới "${walletName}":\n\n💳 Tên ví: ${walletName}\n💰 Số dư ban đầu: 0 VNĐ\n\nBạn có muốn tạo ví này không?`,
        actionType: 'create_wallet',
        actionData: {
          name: walletName,
          balance: 0
        },
        confidence: 0.8
      }
    }

    // Default response for financial insights
    return {
      message: 'Xin chào! Tôi có thể giúp bạn:\n\n• Tạo giao dịch (VD: "Ăn tối 50k")\n• Tạo danh mục mới (VD: "Tạo danh mục du lịch")\n• Tạo ví mới (VD: "Tạo ví tiết kiệm")\n• Tạo ngân sách (VD: "Tạo ngân sách ăn uống 500k/tháng")\n• Phân tích tài chính\n\nBạn muốn làm gì?',
      actionType: 'financial_insight',
      confidence: 0.3
    }
  }

  isAvailable(): boolean {
    return this.model !== null
  }
}

// Create singleton instance
export const geminiApiService = new GeminiApiService()

export default GeminiApiService
