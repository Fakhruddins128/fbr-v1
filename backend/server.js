const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sql = require("mssql");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001; // Changed to port 5001 to avoid conflict

// Middleware
app.use(
  cors({
    origin: [
      "https://fbr-v1.vercel.app", // your frontend domain
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // if using cookies or auth headers
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "YourStrongPassword",
  server: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "FBR_SaaS",
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // for local SQL Server
    trustServerCertificate: true, // for local dev / self-signed certs
    instanceName: process.env.DB_INSTANCE || undefined,
  },
};

// Global variable to track database connection status
let isDbConnected = false;

// Connect to database
async function connectToDatabase() {
  try {
    await sql.connect(dbConfig);
    console.log("Connected to MSSQL database successfully");
    isDbConnected = true;
    return true;
  } catch (err) {
    console.error("Database connection failed:", err);
    console.log("Falling back to mock database for demo");
    isDbConnected = false;
    return false; // Return failure on error
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Authentication token required" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_jwt_secret",
    (err, user) => {
      if (err)
        return res.status(403).json({ message: "Invalid or expired token" });
      req.user = user;
      next();
    }
  );
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }

    next();
  };
};

// Company access control middleware
const requireCompanyAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Super Admin can access any company
  if (req.user.role === "SUPER_ADMIN") {
    return next();
  }

  // Other users can only access their own company
  const requestedCompanyId =
    req.params.companyId || req.body.companyId || req.query.companyId;
  if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
    return res
      .status(403)
      .json({ message: "Access denied. Cannot access other company data." });
  }

  next();
};

// Invoice CRUD endpoints

// Get all invoices
app.get("/api/invoices", authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("companyId", sql.UniqueIdentifier, req.user.companyId).query(`
        SELECT 
          i.*,
          items.Items
        FROM Invoices i
        OUTER APPLY (
          SELECT 
            ItemID,
            HSCode,
            ProductDescription,
            Rate,
            UoM,
            Quantity,
            TotalValues,
            ValueSalesExcludingST,
            FixedNotifiedValueOrRetailPrice,
            SalesTaxApplicable,
            SalesTaxWithheldAtSource,
            ExtraTax,
            FurtherTax,
            SROScheduleNo,
            FEDPayable,
            Discount,
            SaleType,
            SROItemSerialNo
          FROM InvoiceItems ii
          WHERE ii.InvoiceID = i.InvoiceID
          FOR JSON PATH
        ) AS items(Items)
        WHERE i.CompanyID = @companyId
        ORDER BY i.CreatedAt DESC
      `);

    const invoices = result.recordset.map((invoice) => {
      // Parse and map items to camelCase
      const items = invoice.Items
        ? JSON.parse(invoice.Items).map((item) => ({
            itemID: item.ItemID,
            invoiceID: item.InvoiceID,
            hsCode: item.HSCode,
            productDescription: item.ProductDescription,
            rate: item.Rate,
            uoM: item.UoM,
            quantity: item.Quantity,
            totalValues: item.TotalValues,
            valueSalesExcludingST: item.ValueSalesExcludingST,
            fixedNotifiedValueOrRetailPrice:
              item.FixedNotifiedValueOrRetailPrice,
            salesTaxApplicable: item.SalesTaxApplicable,
            salesTaxWithheldAtSource: item.SalesTaxWithheldAtSource,
            extraTax: item.ExtraTax,
            furtherTax: item.FurtherTax,
            sroScheduleNo: item.SROScheduleNo,
            fedPayable: item.FEDPayable,
            discount: item.Discount,
            saleType: item.SaleType,
            sroItemSerialNo: item.SROItemSerialNo,
          }))
        : [];

      return {
        invoiceID: invoice.InvoiceID,
        companyID: invoice.CompanyID,
        invoiceType: invoice.InvoiceType,
        invoiceDate: invoice.InvoiceDate,
        sellerNTNCNIC: invoice.SellerNTNCNIC,
        sellerBusinessName: invoice.SellerBusinessName,
        sellerProvince: invoice.SellerProvince,
        sellerAddress: invoice.SellerAddress,
        buyerNTNCNIC: invoice.BuyerNTNCNIC,
        buyerBusinessName: invoice.BuyerBusinessName,
        buyerProvince: invoice.BuyerProvince,
        buyerAddress: invoice.BuyerAddress,
        buyerRegistrationType: invoice.BuyerRegistrationType,
        invoiceRefNo: invoice.InvoiceRefNo,
        totalAmount: invoice.TotalAmount,
        totalSalesTax: invoice.TotalSalesTax,
        totalFurtherTax: invoice.TotalFurtherTax,
        totalDiscount: invoice.TotalDiscount,
        scenarioID: invoice.ScenarioID,
        createdAt: invoice.CreatedAt,
        updatedAt: invoice.UpdatedAt,
        createdBy: invoice.CreatedBy,
        items: items,
      };
    });

    console.log(
      "Returning invoices with IDs:",
      invoices.map((inv) => ({ id: inv.invoiceID, type: typeof inv.invoiceID }))
    );

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
});

// Get single invoice by ID
app.get("/api/invoices/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("invoiceId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, req.user.companyId).query(`
        SELECT 
          i.*,
          items.Items
        FROM Invoices i
        OUTER APPLY (
          SELECT 
            ItemID,
            HSCode,
            ProductDescription,
            Rate,
            UoM,
            Quantity,
            TotalValues,
            ValueSalesExcludingST,
            FixedNotifiedValueOrRetailPrice,
            SalesTaxApplicable,
            SalesTaxWithheldAtSource,
            ExtraTax,
            FurtherTax,
            SROScheduleNo,
            FEDPayable,
            Discount,
            SaleType,
            SROItemSerialNo
          FROM InvoiceItems ii
          WHERE ii.InvoiceID = i.InvoiceID
          FOR JSON PATH
        ) AS items(Items)
        WHERE i.InvoiceID = @invoiceId AND i.CompanyID = @companyId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const invoice = result.recordset[0];

    // Parse and map items to camelCase
    const items = invoice.Items
      ? JSON.parse(invoice.Items).map((item) => ({
          itemID: item.ItemID,
          invoiceID: item.InvoiceID,
          hsCode: item.HSCode,
          productDescription: item.ProductDescription,
          rate: item.Rate,
          uoM: item.UoM,
          quantity: item.Quantity,
          totalValues: item.TotalValues,
          valueSalesExcludingST: item.ValueSalesExcludingST,
          fixedNotifiedValueOrRetailPrice: item.FixedNotifiedValueOrRetailPrice,
          salesTaxApplicable: item.SalesTaxApplicable,
          salesTaxWithheldAtSource: item.SalesTaxWithheldAtSource,
          extraTax: item.ExtraTax,
          furtherTax: item.FurtherTax,
          sroScheduleNo: item.SROScheduleNo,
          fedPayable: item.FEDPayable,
          discount: item.Discount,
          saleType: item.SaleType,
          sroItemSerialNo: item.SROItemSerialNo,
        }))
      : [];

    const invoiceData = {
      invoiceID: invoice.InvoiceID,
      companyID: invoice.CompanyID,
      invoiceType: invoice.InvoiceType,
      invoiceDate: invoice.InvoiceDate,
      sellerNTNCNIC: invoice.SellerNTNCNIC,
      sellerBusinessName: invoice.SellerBusinessName,
      sellerProvince: invoice.SellerProvince,
      sellerAddress: invoice.SellerAddress,
      buyerNTNCNIC: invoice.BuyerNTNCNIC,
      buyerBusinessName: invoice.BuyerBusinessName,
      buyerProvince: invoice.BuyerProvince,
      buyerAddress: invoice.BuyerAddress,
      buyerRegistrationType: invoice.BuyerRegistrationType,
      invoiceRefNo: invoice.InvoiceRefNo,
      totalAmount: invoice.TotalAmount,
      totalSalesTax: invoice.TotalSalesTax,
      totalFurtherTax: invoice.TotalFurtherTax,
      totalDiscount: invoice.TotalDiscount,
      scenarioID: invoice.ScenarioID,
      createdAt: invoice.CreatedAt,
      updatedAt: invoice.UpdatedAt,
      createdBy: invoice.CreatedBy,
      items: items,
    };

    console.log("Returning single invoice with ID:", invoiceData.invoiceID);

    res.json({
      success: true,
      data: invoiceData,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
});

// Create new invoice
app.post("/api/invoices", authenticateToken, async (req, res) => {
  try {
    const {
      invoiceType,
      invoiceDate,
      sellerNTNCNIC,
      sellerBusinessName,
      sellerProvince,
      sellerAddress,
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      invoiceRefNo,
      items,
    } = req.body;

    // Debug logging for headers and user info
    console.log("=== INVOICE CREATION DEBUG ===");
    console.log("All headers:", Object.keys(req.headers));
    console.log("X-Company-ID header:", req.headers["x-company-id"]);
    console.log("User info:", {
      role: req.user.role,
      companyId: req.user.companyId,
    });

    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
      console.log("Super admin creating invoice for company ID:", companyId);
    }
    console.log("Final companyId to use:", companyId);
    console.log("=== END DEBUG ===");

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // Calculate totals
      const totalAmount = items.reduce(
        (sum, item) => sum + parseFloat(item.totalValues || 0),
        0
      );
      const totalSalesTax = items.reduce(
        (sum, item) => sum + parseFloat(item.salesTaxApplicable || 0),
        0
      );
      const totalFurtherTax = items.reduce(
        (sum, item) => sum + parseFloat(item.furtherTax || 0),
        0
      );
      const totalDiscount = items.reduce(
        (sum, item) => sum + parseFloat(item.discount || 0),
        0
      );

      // Generate unique invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 5)
        .toUpperCase()}`;

      // Insert invoice
      const invoiceResult = await transaction
        .request()
        .input("companyId", sql.UniqueIdentifier, companyId)
        .input("invoiceNumber", sql.NVarChar, invoiceNumber)
        .input("invoiceType", sql.NVarChar, invoiceType)
        .input("invoiceDate", sql.DateTime, new Date(invoiceDate))
        .input("sellerNTNCNIC", sql.NVarChar, sellerNTNCNIC)
        .input("sellerBusinessName", sql.NVarChar, sellerBusinessName)
        .input("sellerProvince", sql.NVarChar, sellerProvince)
        .input("sellerAddress", sql.NVarChar, sellerAddress)
        .input("buyerNTNCNIC", sql.NVarChar, buyerNTNCNIC)
        .input("buyerBusinessName", sql.NVarChar, buyerBusinessName)
        .input("buyerProvince", sql.NVarChar, buyerProvince)
        .input("buyerAddress", sql.NVarChar, buyerAddress)
        .input("buyerRegistrationType", sql.NVarChar, buyerRegistrationType)
        .input("invoiceRefNo", sql.NVarChar, invoiceRefNo || "")
        .input("scenarioID", sql.NVarChar, "SCENARIO_001")
        .input("totalAmount", sql.Decimal(18, 2), totalAmount)
        .input("totalSalesTax", sql.Decimal(18, 2), totalSalesTax)
        .input("totalFurtherTax", sql.Decimal(18, 2), totalFurtherTax)
        .input("totalDiscount", sql.Decimal(18, 2), totalDiscount)
        .input("createdBy", sql.UniqueIdentifier, req.user.userId).query(`
          INSERT INTO Invoices (
            CompanyID, InvoiceNumber, InvoiceType, InvoiceDate, SellerNTNCNIC, SellerBusinessName,
            SellerProvince, SellerAddress, BuyerNTNCNIC, BuyerBusinessName,
            BuyerProvince, BuyerAddress, BuyerRegistrationType, InvoiceRefNo,
            ScenarioID, TotalAmount, TotalSalesTax, TotalFurtherTax, TotalDiscount, CreatedBy
          )
          OUTPUT INSERTED.InvoiceID
          VALUES (
            @companyId, @invoiceNumber, @invoiceType, @invoiceDate, @sellerNTNCNIC, @sellerBusinessName,
            @sellerProvince, @sellerAddress, @buyerNTNCNIC, @buyerBusinessName,
            @buyerProvince, @buyerAddress, @buyerRegistrationType, @invoiceRefNo,
            @scenarioID, @totalAmount, @totalSalesTax, @totalFurtherTax, @totalDiscount, @createdBy
          )
        `);

      const invoiceId = invoiceResult.recordset[0].InvoiceID;

      // Insert invoice items
      for (const item of items) {
        await transaction
          .request()
          .input("invoiceId", sql.UniqueIdentifier, invoiceId)
          .input("hsCode", sql.NVarChar, item.hsCode)
          .input("productDescription", sql.NVarChar, item.productDescription)
          .input("rate", sql.NVarChar, item.rate)
          .input("uoM", sql.NVarChar, item.uoM)
          .input("quantity", sql.Decimal(18, 4), item.quantity)
          .input("totalValues", sql.Decimal(18, 2), item.totalValues || 0)
          .input(
            "valueSalesExcludingST",
            sql.Decimal(18, 2),
            item.valueSalesExcludingST
          )
          .input(
            "fixedNotifiedValueOrRetailPrice",
            sql.Decimal(18, 2),
            item.fixedNotifiedValueOrRetailPrice || 0
          )
          .input(
            "salesTaxApplicable",
            sql.Decimal(18, 2),
            item.salesTaxApplicable || 0
          )
          .input(
            "salesTaxWithheldAtSource",
            sql.Decimal(18, 2),
            item.salesTaxWithheldAtSource || 0
          )
          .input("extraTax", sql.Decimal(18, 2), item.extraTax || 0)
          .input("furtherTax", sql.Decimal(18, 2), item.furtherTax || 0)
          .input("sroScheduleNo", sql.NVarChar, item.sroScheduleNo || "")
          .input("fedPayable", sql.Decimal(18, 2), item.fedPayable || 0)
          .input("discount", sql.Decimal(18, 2), item.discount || 0)
          .input("saleType", sql.NVarChar, item.saleType || "")
          .input("sroItemSerialNo", sql.NVarChar, item.sroItemSerialNo || "")
          .query(`
            INSERT INTO InvoiceItems (
              InvoiceID, HSCode, ProductDescription, Rate, UoM, Quantity,
              TotalValues, ValueSalesExcludingST, FixedNotifiedValueOrRetailPrice,
              SalesTaxApplicable, SalesTaxWithheldAtSource, ExtraTax, FurtherTax,
              SROScheduleNo, FEDPayable, Discount, SaleType, SROItemSerialNo
            )
            VALUES (
              @invoiceId, @hsCode, @productDescription, @rate, @uoM, @quantity,
              @totalValues, @valueSalesExcludingST, @fixedNotifiedValueOrRetailPrice,
              @salesTaxApplicable, @salesTaxWithheldAtSource, @extraTax, @furtherTax,
              @sroScheduleNo, @fedPayable, @discount, @saleType, @sroItemSerialNo
            )
          `);
      }

      await transaction.commit();

      // Fetch the created invoice with items
      const createdInvoice = await pool
        .request()
        .input("invoiceId", sql.UniqueIdentifier, invoiceId).query(`
          SELECT 
            i.*,
            items.Items
          FROM Invoices i
          OUTER APPLY (
            SELECT 
              ItemID,
              HSCode,
              ProductDescription,
              Rate,
              UoM,
              Quantity,
              TotalValues,
              ValueSalesExcludingST,
              FixedNotifiedValueOrRetailPrice,
              SalesTaxApplicable,
              SalesTaxWithheldAtSource,
              ExtraTax,
              FurtherTax,
              SROScheduleNo,
              FEDPayable,
              Discount,
              SaleType,
              SROItemSerialNo
            FROM InvoiceItems ii
            WHERE ii.InvoiceID = i.InvoiceID
            FOR JSON PATH
          ) AS items(Items)
          WHERE i.InvoiceID = @invoiceId
        `);

      const invoice = {
        ...createdInvoice.recordset[0],
        items: createdInvoice.recordset[0].Items
          ? JSON.parse(createdInvoice.recordset[0].Items)
          : [],
      };

      res.status(201).json({
        success: true,
        data: invoice,
        message: "Invoice created successfully",
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      error: error.message,
    });
  }
});

// Update invoice
app.put("/api/invoices/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      invoiceType,
      invoiceDate,
      sellerNTNCNIC,
      sellerBusinessName,
      sellerProvince,
      sellerAddress,
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      invoiceRefNo,
      items,
    } = req.body;

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // Calculate totals
      const totalAmount = items.reduce(
        (sum, item) => sum + parseFloat(item.totalValues || 0),
        0
      );
      const totalSalesTax = items.reduce(
        (sum, item) => sum + parseFloat(item.salesTaxApplicable || 0),
        0
      );
      const totalFurtherTax = items.reduce(
        (sum, item) => sum + parseFloat(item.furtherTax || 0),
        0
      );
      const totalDiscount = items.reduce(
        (sum, item) => sum + parseFloat(item.discount || 0),
        0
      );

      // Update invoice
      const invoiceResult = await transaction
        .request()
        .input("invoiceId", sql.UniqueIdentifier, id)
        .input("companyId", sql.UniqueIdentifier, req.user.companyId)
        .input("invoiceType", sql.NVarChar, invoiceType)
        .input("invoiceDate", sql.DateTime, new Date(invoiceDate))
        .input("sellerNTNCNIC", sql.NVarChar, sellerNTNCNIC)
        .input("sellerBusinessName", sql.NVarChar, sellerBusinessName)
        .input("sellerProvince", sql.NVarChar, sellerProvince)
        .input("sellerAddress", sql.NVarChar, sellerAddress)
        .input("buyerNTNCNIC", sql.NVarChar, buyerNTNCNIC)
        .input("buyerBusinessName", sql.NVarChar, buyerBusinessName)
        .input("buyerProvince", sql.NVarChar, buyerProvince)
        .input("buyerAddress", sql.NVarChar, buyerAddress)
        .input("buyerRegistrationType", sql.NVarChar, buyerRegistrationType)
        .input("invoiceRefNo", sql.NVarChar, invoiceRefNo || "")
        .input("totalAmount", sql.Decimal(18, 2), totalAmount)
        .input("totalSalesTax", sql.Decimal(18, 2), totalSalesTax)
        .input("totalFurtherTax", sql.Decimal(18, 2), totalFurtherTax)
        .input("totalDiscount", sql.Decimal(18, 2), totalDiscount).query(`
          UPDATE Invoices SET
            InvoiceType = @invoiceType,
            InvoiceDate = @invoiceDate,
            SellerNTNCNIC = @sellerNTNCNIC,
            SellerBusinessName = @sellerBusinessName,
            SellerProvince = @sellerProvince,
            SellerAddress = @sellerAddress,
            BuyerNTNCNIC = @buyerNTNCNIC,
            BuyerBusinessName = @buyerBusinessName,
            BuyerProvince = @buyerProvince,
            BuyerAddress = @buyerAddress,
            BuyerRegistrationType = @buyerRegistrationType,
            InvoiceRefNo = @invoiceRefNo,
            TotalAmount = @totalAmount,
            TotalSalesTax = @totalSalesTax,
            TotalFurtherTax = @totalFurtherTax,
            TotalDiscount = @totalDiscount,
            UpdatedAt = GETDATE()
          WHERE InvoiceID = @invoiceId AND CompanyID = @companyId
        `);

      if (invoiceResult.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // Delete existing items
      await transaction
        .request()
        .input("invoiceId", sql.UniqueIdentifier, id)
        .query("DELETE FROM InvoiceItems WHERE InvoiceID = @invoiceId");

      // Insert updated items
      for (const item of items) {
        await transaction
          .request()
          .input("invoiceId", sql.UniqueIdentifier, id)
          .input("hsCode", sql.NVarChar, item.hsCode)
          .input("productDescription", sql.NVarChar, item.productDescription)
          .input("rate", sql.NVarChar, item.rate)
          .input("uoM", sql.NVarChar, item.uoM)
          .input("quantity", sql.Decimal(18, 4), item.quantity)
          .input("totalValues", sql.Decimal(18, 2), item.totalValues || 0)
          .input(
            "valueSalesExcludingST",
            sql.Decimal(18, 2),
            item.valueSalesExcludingST
          )
          .input(
            "fixedNotifiedValueOrRetailPrice",
            sql.Decimal(18, 2),
            item.fixedNotifiedValueOrRetailPrice || 0
          )
          .input(
            "salesTaxApplicable",
            sql.Decimal(18, 2),
            item.salesTaxApplicable || 0
          )
          .input(
            "salesTaxWithheldAtSource",
            sql.Decimal(18, 2),
            item.salesTaxWithheldAtSource || 0
          )
          .input("extraTax", sql.Decimal(18, 2), item.extraTax || 0)
          .input("furtherTax", sql.Decimal(18, 2), item.furtherTax || 0)
          .input("sroScheduleNo", sql.NVarChar, item.sroScheduleNo || "")
          .input("fedPayable", sql.Decimal(18, 2), item.fedPayable || 0)
          .input("discount", sql.Decimal(18, 2), item.discount || 0)
          .input("saleType", sql.NVarChar, item.saleType)
          .input("sroItemSerialNo", sql.NVarChar, item.sroItemSerialNo || "")
          .query(`
            INSERT INTO InvoiceItems (
              InvoiceID, HSCode, ProductDescription, Rate, UoM, Quantity,
              TotalValues, ValueSalesExcludingST, FixedNotifiedValueOrRetailPrice,
              SalesTaxApplicable, SalesTaxWithheldAtSource, ExtraTax, FurtherTax,
              SROScheduleNo, FEDPayable, Discount, SaleType, SROItemSerialNo
            )
            VALUES (
              @invoiceId, @hsCode, @productDescription, @rate, @uoM, @quantity,
              @totalValues, @valueSalesExcludingST, @fixedNotifiedValueOrRetailPrice,
              @salesTaxApplicable, @salesTaxWithheldAtSource, @extraTax, @furtherTax,
              @sroScheduleNo, @fedPayable, @discount, @saleType, @sroItemSerialNo
            )
          `);
      }

      await transaction.commit();

      // Fetch the updated invoice with items
      const updatedInvoice = await pool
        .request()
        .input("invoiceId", sql.UniqueIdentifier, id).query(`
          SELECT 
            i.*,
            items.Items
          FROM Invoices i
          OUTER APPLY (
            SELECT 
              ItemID,
              HSCode,
              ProductDescription,
              Rate,
              UoM,
              Quantity,
              TotalValues,
              ValueSalesExcludingST,
              FixedNotifiedValueOrRetailPrice,
              SalesTaxApplicable,
              SalesTaxWithheldAtSource,
              ExtraTax,
              FurtherTax,
              SROScheduleNo,
              FEDPayable,
              Discount,
              SaleType,
              SROItemSerialNo
            FROM InvoiceItems ii
            WHERE ii.InvoiceID = i.InvoiceID
            FOR JSON PATH
          ) AS items(Items)
          WHERE i.InvoiceID = @invoiceId
        `);

      const invoice = {
        ...updatedInvoice.recordset[0],
        items: updatedInvoice.recordset[0].Items
          ? JSON.parse(updatedInvoice.recordset[0].Items)
          : [],
      };

      res.json({
        success: true,
        data: invoice,
        message: "Invoice updated successfully",
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update invoice",
      error: error.message,
    });
  }
});

// Delete invoice
app.delete("/api/invoices/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(
      "Delete request received for invoice ID:",
      id,
      "Type:",
      typeof id,
      "Length:",
      id.length
    );
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // Delete invoice items first
      await transaction
        .request()
        .input("invoiceId", sql.UniqueIdentifier, id)
        .query("DELETE FROM InvoiceItems WHERE InvoiceID = @invoiceId");

      // Delete invoice
      const result = await transaction
        .request()
        .input("invoiceId", sql.UniqueIdentifier, id)
        .input("companyId", sql.UniqueIdentifier, req.user.companyId)
        .query(
          "DELETE FROM Invoices WHERE InvoiceID = @invoiceId AND CompanyID = @companyId"
        );

      if (result.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      await transaction.commit();

      res.json({
        success: true,
        message: "Invoice deleted successfully",
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete invoice",
      error: error.message,
    });
  }
});

// Routes

// Scenario lookup endpoint
app.post("/api/scenarios/lookup", authenticateToken, async (req, res) => {
  try {
    const { businessActivities, sectors } = req.body;

    if (
      !businessActivities ||
      !sectors ||
      !Array.isArray(businessActivities) ||
      !Array.isArray(sectors)
    ) {
      return res.status(400).json({
        success: false,
        message: "Business activities and sectors must be provided as arrays",
      });
    }

    if (businessActivities.length === 0 || sectors.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    if (!isDbConnected) {
      // Return mock data when database is not connected
      const mockScenarios = ["SN001", "SN002", "SN005"];
      return res.json({
        success: true,
        data: mockScenarios,
      });
    }

    const pool = await sql.connect(dbConfig);

    // Create parameterized query for business activities and sectors
    const businessActivityParams = businessActivities
      .map((_, index) => `@businessActivity${index}`)
      .join(", ");
    const sectorParams = sectors
      .map((_, index) => `@sector${index}`)
      .join(", ");

    const query = `
      SELECT DISTINCT ApplicableScenarios
      FROM ScenarioMapping 
      WHERE BusinessActivity IN (${businessActivityParams})
        AND Sector IN (${sectorParams})
        AND IsActive = 1
    `;

    const request = pool.request();

    // Add parameters for business activities
    businessActivities.forEach((activity, index) => {
      request.input(`businessActivity${index}`, sql.NVarChar, activity);
    });

    // Add parameters for sectors
    sectors.forEach((sector, index) => {
      request.input(`sector${index}`, sql.NVarChar, sector);
    });

    const result = await request.query(query);

    // Extract and flatten scenarios from comma-separated strings
    const allScenarios = new Set();
    result.recordset.forEach((row) => {
      if (row.ApplicableScenarios) {
        const scenarios = row.ApplicableScenarios.split(",").map((s) =>
          s.trim()
        );
        scenarios.forEach((scenario) => allScenarios.add(scenario));
      }
    });

    const uniqueScenarios = Array.from(allScenarios).sort();

    res.json({
      success: true,
      data: uniqueScenarios,
    });
  } catch (error) {
    console.error("Error looking up scenarios:", error);
    res.status(500).json({
      success: false,
      message: "Failed to lookup scenarios",
      error: error.message,
    });
  }
});

// Validate business activity and sector combination endpoint
app.post("/api/scenarios/validate", authenticateToken, async (req, res) => {
  try {
    const { businessActivities, sectors } = req.body;

    if (
      !businessActivities ||
      !sectors ||
      !Array.isArray(businessActivities) ||
      !Array.isArray(sectors)
    ) {
      return res.status(400).json({
        success: false,
        message: "Business activities and sectors must be provided as arrays",
      });
    }

    if (businessActivities.length === 0 || sectors.length === 0) {
      return res.json({
        success: true,
        isValid: true,
        message: "No combinations to validate",
      });
    }

    if (!isDbConnected) {
      // Return mock validation when database is not connected
      return res.json({
        success: true,
        isValid: true,
        message: "Combination is valid (mock mode)",
      });
    }

    const pool = await sql.connect(dbConfig);

    // Create parameterized query for business activities and sectors
    const businessActivityParams = businessActivities
      .map((_, index) => `@businessActivity${index}`)
      .join(", ");
    const sectorParams = sectors
      .map((_, index) => `@sector${index}`)
      .join(", ");

    const query = `
      SELECT COUNT(*) as CombinationCount
      FROM ScenarioMapping 
      WHERE BusinessActivity IN (${businessActivityParams})
        AND Sector IN (${sectorParams})
        AND IsActive = 1
    `;

    const request = pool.request();

    // Add parameters for business activities
    businessActivities.forEach((activity, index) => {
      request.input(`businessActivity${index}`, sql.NVarChar, activity);
    });

    // Add parameters for sectors
    sectors.forEach((sector, index) => {
      request.input(`sector${index}`, sql.NVarChar, sector);
    });

    const result = await request.query(query);
    const combinationCount = result.recordset[0].CombinationCount;

    const isValid = combinationCount > 0;

    res.json({
      success: true,
      isValid: isValid,
      message: isValid
        ? "Business Activity and Sector combination is valid"
        : "No valid FBR scenarios found for this Business Activity and Sector combination",
    });
  } catch (error) {
    console.error("Error validating combination:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate combination",
      error: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  console.log("Login attempt:", { username, passwordLength: password?.length });

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    // Query the database for the user
    const request = new sql.Request();
    request.input("username", sql.NVarChar, username);

    const result = await request.query(`
      SELECT UserID, Username, PasswordHash, Email, FirstName, LastName, Role, CompanyID, IsActive
      FROM Users 
      WHERE Username = @username AND IsActive = 1
    `);

    console.log("Database query result:", {
      found: result.recordset.length > 0,
      username,
    });

    if (result.recordset.length === 0) {
      console.log("User not found:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.recordset[0];
    console.log("User found:", {
      userId: user.UserID,
      username: user.Username,
      role: user.Role,
    });

    // Verify password hash
    const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
    console.log("Password verification:", { isValid: isValidPassword });

    if (!isValidPassword) {
      console.log("Invalid password for user:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.UserID,
        userId: user.UserID,
        username: user.Username,
        role: user.Role,
        companyId: user.CompanyID,
      },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "24h" }
    );

    // Return user data and token
    res.status(200).json({
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        role: user.Role,
        firstName: user.FirstName,
        lastName: user.LastName,
        companyId: user.CompanyID,
        isActive: user.IsActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ===== USER MANAGEMENT ENDPOINTS =====

// Get all users (Super Admin can see all, Company Admin can see their company users)
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const request = new sql.Request();
    let query = `
      SELECT u.UserID, u.Username, u.Email, u.FirstName, u.LastName, u.Role, 
             u.CompanyID, u.IsActive, u.CreatedAt, u.UpdatedAt,
             c.Name as CompanyName
      FROM Users u
      LEFT JOIN Companies c ON u.CompanyID = c.CompanyID
      WHERE u.IsActive = 1
    `;

    // Role-based filtering
    if (req.user.role === "SUPER_ADMIN") {
      // Super Admin can see all users
      query += " ORDER BY u.CreatedAt DESC";
    } else if (req.user.role === "COMPANY_ADMIN") {
      // Company Admin can only see users from their company
      query += " AND u.CompanyID = @companyId ORDER BY u.CreatedAt DESC";
      request.input("companyId", sql.UniqueIdentifier, req.user.companyId);
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    const result = await request.query(query);

    const users = result.recordset.map((user) => ({
      id: user.UserID.toString(),
      username: user.Username,
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName,
      role: user.Role,
      companyId: user.CompanyID ? user.CompanyID.toString() : null,
      companyName: user.CompanyName,
      isActive: user.IsActive,
      createdAt: user.CreatedAt.toISOString(),
      updatedAt: user.UpdatedAt.toISOString(),
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

// Create new user
app.post("/api/users", authenticateToken, async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, role, companyId } =
      req.body;

    // Validate required fields
    if (!username || !password || !email || !firstName || !lastName || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Role-based access control for user creation
    if (req.user.role === "SUPER_ADMIN") {
      // Super Admin can create any user
      if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN" && !companyId) {
        return res.status(400).json({
          message: "Company ID is required for non-super admin users",
        });
      }
    } else if (req.user.role === "COMPANY_ADMIN") {
      // Company Admin can only create users for their company
      if (companyId !== req.user.companyId) {
        return res.status(403).json({
          message: "Access denied. Can only create users for your company.",
        });
      }
      if (role === "SUPER_ADMIN" || role === "COMPANY_ADMIN") {
        return res
          .status(403)
          .json({ message: "Access denied. Cannot create admin users." });
      }
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    // Validate role
    const validRoles = [
      "SUPER_ADMIN",
      "COMPANY_ADMIN",
      "ADMIN",
      "ACCOUNTANT",
      "SALES_PERSON",
    ];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const request = new sql.Request();

    // Check if username already exists
    const existingUser = await request
      .input("checkUsername", sql.NVarChar(50), username)
      .query("SELECT UserID FROM Users WHERE Username = @checkUsername");

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create new user
    const result = await request
      .input("username", sql.NVarChar(50), username)
      .input("passwordHash", sql.NVarChar(255), hashedPassword)
      .input("email", sql.NVarChar(100), email)
      .input("firstName", sql.NVarChar(50), firstName)
      .input("lastName", sql.NVarChar(50), lastName)
      .input("role", sql.NVarChar(20), role)
      .input("companyId", sql.UniqueIdentifier, companyId || null).query(`
        INSERT INTO Users (Username, PasswordHash, Email, FirstName, LastName, Role, CompanyID, IsActive, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, 
               INSERTED.Role, INSERTED.CompanyID, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
        VALUES (@username, @passwordHash, @email, @firstName, @lastName, @role, @companyId, 1, GETDATE(), GETDATE())
      `);

    const newUser = result.recordset[0];
    const formattedUser = {
      id: newUser.UserID.toString(),
      username: newUser.Username,
      email: newUser.Email,
      firstName: newUser.FirstName,
      lastName: newUser.LastName,
      role: newUser.Role,
      companyId: newUser.CompanyID ? newUser.CompanyID.toString() : null,
      isActive: newUser.IsActive,
      createdAt: newUser.CreatedAt.toISOString(),
      updatedAt: newUser.UpdatedAt.toISOString(),
    };

    res.status(201).json(formattedUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error while creating user" });
  }
});

// Update user
app.put("/api/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, companyId, isActive } = req.body;

    // Get existing user to check permissions
    const checkRequest = new sql.Request();
    const existingUser = await checkRequest
      .input("userId", sql.UniqueIdentifier, id)
      .query(
        "SELECT UserID, Role, CompanyID FROM Users WHERE UserID = @userId"
      );

    if (existingUser.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userToUpdate = existingUser.recordset[0];

    // Role-based access control for user updates
    if (req.user.role === "SUPER_ADMIN") {
      // Super Admin can update any user
    } else if (req.user.role === "COMPANY_ADMIN") {
      // Company Admin can only update users from their company
      if (userToUpdate.CompanyID !== req.user.companyId) {
        return res.status(403).json({
          message: "Access denied. Can only update users from your company.",
        });
      }
      // Cannot update admin users
      if (
        userToUpdate.Role === "SUPER_ADMIN" ||
        userToUpdate.Role === "COMPANY_ADMIN"
      ) {
        return res
          .status(403)
          .json({ message: "Access denied. Cannot update admin users." });
      }
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    // Build update query dynamically
    let updateFields = [];
    let inputs = {};

    if (email !== undefined) {
      updateFields.push("Email = @email");
      inputs.email = email;
    }
    if (firstName !== undefined) {
      updateFields.push("FirstName = @firstName");
      inputs.firstName = firstName;
    }
    if (lastName !== undefined) {
      updateFields.push("LastName = @lastName");
      inputs.lastName = lastName;
    }
    if (role !== undefined && req.user.role === "SUPER_ADMIN") {
      const validRoles = [
        "SUPER_ADMIN",
        "COMPANY_ADMIN",
        "ADMIN",
        "ACCOUNTANT",
        "SALES_PERSON",
      ];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role specified" });
      }
      updateFields.push("Role = @role");
      inputs.role = role;
    }
    if (companyId !== undefined && req.user.role === "SUPER_ADMIN") {
      updateFields.push("CompanyID = @companyId");
      inputs.companyId = companyId;
    }
    if (isActive !== undefined && req.user.role === "SUPER_ADMIN") {
      updateFields.push("IsActive = @isActive");
      inputs.isActive = isActive;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    updateFields.push("UpdatedAt = GETDATE()");

    const request = new sql.Request();
    request.input("userId", sql.UniqueIdentifier, id);

    // Add all inputs
    Object.keys(inputs).forEach((key) => {
      if (key === "companyId") {
        request.input(key, sql.UniqueIdentifier, inputs[key]);
      } else if (key === "isActive") {
        request.input(key, sql.Bit, inputs[key]);
      } else {
        request.input(key, sql.NVarChar, inputs[key]);
      }
    });

    const result = await request.query(`
      UPDATE Users 
      SET ${updateFields.join(", ")}
      OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName,
             INSERTED.Role, INSERTED.CompanyID, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
      WHERE UserID = @userId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = result.recordset[0];
    const formattedUser = {
      id: updatedUser.UserID.toString(),
      username: updatedUser.Username,
      email: updatedUser.Email,
      firstName: updatedUser.FirstName,
      lastName: updatedUser.LastName,
      role: updatedUser.Role,
      companyId: updatedUser.CompanyID
        ? updatedUser.CompanyID.toString()
        : null,
      isActive: updatedUser.IsActive,
      createdAt: updatedUser.CreatedAt.toISOString(),
      updatedAt: updatedUser.UpdatedAt.toISOString(),
    };

    res.status(200).json(formattedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error while updating user" });
  }
});

// Delete user (soft delete)
app.delete("/api/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing user to check permissions
    const checkRequest = new sql.Request();
    const existingUser = await checkRequest
      .input("userId", sql.UniqueIdentifier, id)
      .query(
        "SELECT UserID, Role, CompanyID FROM Users WHERE UserID = @userId AND IsActive = 1"
      );

    if (existingUser.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userToDelete = existingUser.recordset[0];

    // Role-based access control for user deletion
    if (req.user.role === "SUPER_ADMIN") {
      // Super Admin can delete any user except themselves
      if (userToDelete.UserID === req.user.id) {
        return res
          .status(400)
          .json({ message: "Cannot delete your own account" });
      }
    } else if (req.user.role === "COMPANY_ADMIN") {
      // Company Admin can only delete users from their company
      if (userToDelete.CompanyID !== req.user.companyId) {
        return res.status(403).json({
          message: "Access denied. Can only delete users from your company.",
        });
      }
      // Cannot delete admin users
      if (
        userToDelete.Role === "SUPER_ADMIN" ||
        userToDelete.Role === "COMPANY_ADMIN"
      ) {
        return res
          .status(403)
          .json({ message: "Access denied. Cannot delete admin users." });
      }
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    // Soft delete the user
    const request = new sql.Request();
    const result = await request.input("userId", sql.UniqueIdentifier, id)
      .query(`
        UPDATE Users 
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
});

// Change user password
app.put("/api/users/:id/password", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    // Users can change their own password, or admins can change others'
    if (
      req.user.id !== id &&
      req.user.role !== "SUPER_ADMIN" &&
      req.user.role !== "COMPANY_ADMIN"
    ) {
      return res
        .status(403)
        .json({ message: "Access denied. Can only change your own password." });
    }

    // Get user for password verification
    const checkRequest = new sql.Request();
    const existingUser = await checkRequest
      .input("userId", sql.UniqueIdentifier, id)
      .query(
        "SELECT UserID, PasswordHash, CompanyID FROM Users WHERE UserID = @userId AND IsActive = 1"
      );

    if (existingUser.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userToUpdate = existingUser.recordset[0];

    // If changing own password, verify current password
    if (req.user.id === id && currentPassword) {
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        userToUpdate.PasswordHash
      );
      if (!isValidPassword) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
    }

    // Company Admin access control
    if (req.user.role === "COMPANY_ADMIN" && req.user.id !== id) {
      if (userToUpdate.CompanyID !== req.user.companyId) {
        return res.status(403).json({
          message:
            "Access denied. Can only change passwords for users in your company.",
        });
      }
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const request = new sql.Request();
    const result = await request
      .input("userId", sql.UniqueIdentifier, id)
      .input("passwordHash", sql.NVarChar(255), hashedPassword).query(`
        UPDATE Users 
        SET PasswordHash = @passwordHash, UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error while updating password" });
  }
});

// Super Admin: Switch company context
app.post(
  "/api/auth/switch-company",
  authenticateToken,
  requireRole(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const { companyId } = req.body;

      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }

      // Verify company exists
      const request = new sql.Request();
      const company = await request
        .input("companyId", sql.UniqueIdentifier, companyId)
        .query(
          "SELECT CompanyID, Name FROM Companies WHERE CompanyID = @companyId AND IsActive = 1"
        );

      if (company.recordset.length === 0) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Create new token with company context
      const token = jwt.sign(
        {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          companyId: companyId,
          switchedContext: true,
        },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "24h" }
      );

      res.status(200).json({
        token,
        company: {
          id: company.recordset[0].CompanyID.toString(),
          name: company.recordset[0].Name,
        },
        message: "Company context switched successfully",
      });
    } catch (error) {
      console.error("Error switching company:", error);
      res.status(500).json({ message: "Server error while switching company" });
    }
  }
);

// Get user profile
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.input(
      "userId",
      sql.UniqueIdentifier,
      req.user.id
    ).query(`
        SELECT u.UserID, u.Username, u.Email, u.FirstName, u.LastName, u.Role, 
               u.CompanyID, u.IsActive, u.CreatedAt, u.UpdatedAt,
               c.Name as CompanyName
        FROM Users u
        LEFT JOIN Companies c ON u.CompanyID = c.CompanyID
        WHERE u.UserID = @userId AND u.IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.recordset[0];
    const userProfile = {
      id: user.UserID.toString(),
      username: user.Username,
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName,
      role: user.Role,
      companyId: user.CompanyID ? user.CompanyID.toString() : null,
      companyName: user.CompanyName,
      isActive: user.IsActive,
      createdAt: user.CreatedAt.toISOString(),
      updatedAt: user.UpdatedAt.toISOString(),
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching user profile" });
  }
});

// ===== COMPANY ENDPOINTS =====

// Protected company routes
app.get("/api/companies", authenticateToken, async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "SUPER_ADMIN") {
    return res
      .status(403)
      .json({ message: "Access denied. Super Admin role required." });
  }

  try {
    // Query the database for companies
    const request = new sql.Request();

    const result = await request.query(`
      SELECT CompanyID, Name, NTNNumber, CNIC, Address, City, Province, 
             ContactPerson, ContactEmail, ContactPhone, BusinessActivity, Sector, IsActive, CreatedAt, UpdatedAt
      FROM Companies 
      WHERE IsActive = 1
      ORDER BY Name
    `);

    // Format the response to match frontend expectations
    const companies = result.recordset.map((company) => ({
      id: company.CompanyID.toString(),
      name: company.Name,
      ntnNumber: company.NTNNumber,
      cnic: company.CNIC,
      address: company.Address,
      city: company.City,
      province: company.Province,
      contactPerson: company.ContactPerson,
      contactEmail: company.ContactEmail,
      contactPhone: company.ContactPhone,
      businessActivity: company.BusinessActivity
        ? JSON.parse(company.BusinessActivity)
        : [],
      sector: company.Sector ? JSON.parse(company.Sector) : [],
      isActive: company.IsActive,
      createdAt: company.CreatedAt.toISOString(),
      updatedAt: company.UpdatedAt.toISOString(),
    }));

    res.status(200).json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Server error while fetching companies" });
  }
});

// Get all companies with their FBR token status (Super Admin only) - MUST be before parameterized routes
app.get(
  "/api/companies/fbr-tokens",
  authenticateToken,
  requireRole(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      // Query the database for all companies and their FBR token status
      const request = new sql.Request();

      const result = await request.query(`
      SELECT 
        CompanyID, 
        Name, 
        NTNNumber,
        CASE 
          WHEN FBRToken IS NOT NULL AND LEN(FBRToken) > 0 THEN 1 
          ELSE 0 
        END as HasFBRToken,
        UpdatedAt
      FROM Companies 
      WHERE IsActive = 1
      ORDER BY Name
    `);

      // Format the response
      const companies = result.recordset.map((company) => ({
        id: company.CompanyID,
        name: company.Name,
        ntnNumber: company.NTNNumber,
        hasFbrToken: company.HasFBRToken === 1,
        lastUpdated: company.UpdatedAt ? company.UpdatedAt.toISOString() : null,
      }));

      res.status(200).json({
        success: true,
        data: companies,
      });
    } catch (error) {
      console.error("Error fetching companies FBR token status:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching companies FBR token status",
      });
    }
  }
);

// Get single company by ID endpoint
app.get("/api/companies/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user has access to this company
    if (req.user.role !== "SUPER_ADMIN" && req.user.companyId !== id) {
      return res
        .status(403)
        .json({ message: "Access denied. Cannot access other company data." });
    }

    // Query the database for the specific company
    const request = new sql.Request();

    const result = await request.input("id", sql.UniqueIdentifier, id).query(`
        SELECT CompanyID, Name, NTNNumber, Address, City, Province, 
               ContactPerson, ContactEmail, ContactPhone, BusinessActivity, Sector, IsActive, CreatedAt, UpdatedAt
        FROM Companies 
        WHERE CompanyID = @id AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    const company = result.recordset[0];
    const formattedCompany = {
      id: company.CompanyID.toString(),
      name: company.Name,
      ntnNumber: company.NTNNumber,
      address: company.Address,
      city: company.City,
      province: company.Province,
      contactPerson: company.ContactPerson,
      contactEmail: company.ContactEmail,
      contactPhone: company.ContactPhone,
      businessActivity: company.BusinessActivity
        ? JSON.parse(company.BusinessActivity)
        : [],
      sector: company.Sector ? JSON.parse(company.Sector) : [],
      isActive: company.IsActive,
      createdAt: company.CreatedAt.toISOString(),
      updatedAt: company.UpdatedAt.toISOString(),
    };

    res.status(200).json(formattedCompany);
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ message: "Server error while fetching company" });
  }
});

// Create company endpoint
app.post("/api/companies", authenticateToken, async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "SUPER_ADMIN") {
    return res
      .status(403)
      .json({ message: "Access denied. Super Admin role required." });
  }

  const {
    name,
    ntnNumber,
    cnic,
    address,
    city,
    province,
    contactPerson,
    contactEmail,
    contactPhone,
    businessActivity,
    sector,
  } = req.body;

  // Validate required fields
  if (
    !name ||
    !ntnNumber ||
    !address ||
    !city ||
    !province ||
    !contactPerson ||
    !contactEmail ||
    !contactPhone
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Insert into the database
    const request = new sql.Request();

    const result = await request
      .input("name", sql.NVarChar(255), name)
      .input("ntnNumber", sql.NVarChar(50), ntnNumber)
      .input("cnic", sql.NVarChar(20), cnic)
      .input("address", sql.NVarChar(500), address)
      .input("city", sql.NVarChar(100), city)
      .input("province", sql.NVarChar(100), province)
      .input("contactPerson", sql.NVarChar(255), contactPerson)
      .input("contactEmail", sql.NVarChar(255), contactEmail)
      .input("contactPhone", sql.NVarChar(50), contactPhone)
      .input(
        "businessActivity",
        sql.NVarChar(sql.MAX),
        businessActivity ? JSON.stringify(businessActivity) : null
      )
      .input(
        "sector",
        sql.NVarChar(sql.MAX),
        sector ? JSON.stringify(sector) : null
      ).query(`
        INSERT INTO Companies (Name, NTNNumber, CNIC, Address, City, Province, ContactPerson, ContactEmail, ContactPhone, BusinessActivity, Sector, IsActive, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.CompanyID, INSERTED.Name, INSERTED.NTNNumber, INSERTED.CNIC, INSERTED.Address, INSERTED.City, INSERTED.Province, 
               INSERTED.ContactPerson, INSERTED.ContactEmail, INSERTED.ContactPhone, INSERTED.BusinessActivity, INSERTED.Sector, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
        VALUES (@name, @ntnNumber, @cnic, @address, @city, @province, @contactPerson, @contactEmail, @contactPhone, @businessActivity, @sector, 1, GETDATE(), GETDATE())
      `);

    const newCompany = result.recordset[0];
    const formattedCompany = {
      id: newCompany.CompanyID.toString(),
      name: newCompany.Name,
      ntnNumber: newCompany.NTNNumber,
      cnic: newCompany.CNIC,
      address: newCompany.Address,
      city: newCompany.City,
      province: newCompany.Province,
      contactPerson: newCompany.ContactPerson,
      contactEmail: newCompany.ContactEmail,
      contactPhone: newCompany.ContactPhone,
      businessActivity: newCompany.BusinessActivity
        ? JSON.parse(newCompany.BusinessActivity)
        : [],
      sector: newCompany.Sector ? JSON.parse(newCompany.Sector) : [],
      isActive: newCompany.IsActive,
      createdAt: newCompany.CreatedAt.toISOString(),
      updatedAt: newCompany.UpdatedAt.toISOString(),
    };

    res.status(201).json(formattedCompany);
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ message: "Server error while creating company" });
  }
});

// Update company endpoint
app.put("/api/companies/:id", authenticateToken, async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "SUPER_ADMIN") {
    return res
      .status(403)
      .json({ message: "Access denied. Super Admin role required." });
  }

  const { id } = req.params;
  const {
    name,
    ntnNumber,
    cnic,
    address,
    city,
    province,
    contactPerson,
    contactEmail,
    contactPhone,
    businessActivity,
    sector,
    isActive,
  } = req.body;

  // Validate required fields
  if (
    !name ||
    !ntnNumber ||
    !address ||
    !city ||
    !province ||
    !contactPerson ||
    !contactEmail ||
    !contactPhone
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Update in the database
    const request = new sql.Request();

    const result = await request
      .input("id", sql.UniqueIdentifier, id)
      .input("name", sql.NVarChar(255), name)
      .input("ntnNumber", sql.NVarChar(50), ntnNumber)
      .input("cnic", sql.NVarChar(20), cnic)
      .input("address", sql.NVarChar(500), address)
      .input("city", sql.NVarChar(100), city)
      .input("province", sql.NVarChar(100), province)
      .input("contactPerson", sql.NVarChar(255), contactPerson)
      .input("contactEmail", sql.NVarChar(255), contactEmail)
      .input("contactPhone", sql.NVarChar(50), contactPhone)
      .input(
        "businessActivity",
        sql.NVarChar(sql.MAX),
        businessActivity ? JSON.stringify(businessActivity) : null
      )
      .input(
        "sector",
        sql.NVarChar(sql.MAX),
        sector ? JSON.stringify(sector) : null
      )
      .input("isActive", sql.Bit, isActive).query(`
        UPDATE Companies 
        SET Name = @name, NTNNumber = @ntnNumber, CNIC = @cnic, Address = @address, City = @city, Province = @province,
            ContactPerson = @contactPerson, ContactEmail = @contactEmail, ContactPhone = @contactPhone,
            BusinessActivity = @businessActivity, Sector = @sector, IsActive = @isActive, UpdatedAt = GETDATE()
        OUTPUT INSERTED.CompanyID, INSERTED.Name, INSERTED.NTNNumber, INSERTED.CNIC, INSERTED.Address, INSERTED.City, INSERTED.Province,
               INSERTED.ContactPerson, INSERTED.ContactEmail, INSERTED.ContactPhone, INSERTED.BusinessActivity, INSERTED.Sector, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
        WHERE CompanyID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    const updatedCompany = result.recordset[0];
    const formattedCompany = {
      id: updatedCompany.CompanyID.toString(),
      name: updatedCompany.Name,
      ntnNumber: updatedCompany.NTNNumber,
      cnic: updatedCompany.CNIC,
      address: updatedCompany.Address,
      city: updatedCompany.City,
      province: updatedCompany.Province,
      contactPerson: updatedCompany.ContactPerson,
      contactEmail: updatedCompany.ContactEmail,
      contactPhone: updatedCompany.ContactPhone,
      businessActivity: updatedCompany.BusinessActivity
        ? JSON.parse(updatedCompany.BusinessActivity)
        : [],
      sector: updatedCompany.Sector ? JSON.parse(updatedCompany.Sector) : [],
      isActive: updatedCompany.IsActive,
      createdAt: updatedCompany.CreatedAt.toISOString(),
      updatedAt: updatedCompany.UpdatedAt.toISOString(),
    };

    res.status(200).json(formattedCompany);
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ message: "Server error while updating company" });
  }
});

// FBR Token Management Endpoints

// Get FBR token for a company
app.get(
  "/api/companies/:id/fbr-token",
  authenticateToken,
  requireCompanyAccess,
  async (req, res) => {
    const { id } = req.params;

    try {
      // Query the database for the company's FBR token
      const request = new sql.Request();

      const result = await request.input("id", sql.UniqueIdentifier, id).query(`
        SELECT FBRToken
        FROM Companies 
        WHERE CompanyID = @id AND IsActive = 1
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "Company not found" });
      }

      const company = result.recordset[0];

      res.status(200).json({
        success: true,
        data: {
          companyId: id,
          fbrToken: company.FBRToken || null,
        },
      });
    } catch (error) {
      console.error("Error fetching FBR token:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching FBR token",
      });
    }
  }
);

// Set/Update FBR token for a company
app.put(
  "/api/companies/:id/fbr-token",
  authenticateToken,
  requireCompanyAccess,
  async (req, res) => {
    const { id } = req.params;
    const { fbrToken } = req.body;

    // Validate token
    if (
      !fbrToken ||
      typeof fbrToken !== "string" ||
      fbrToken.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "FBR token is required and must be a non-empty string",
      });
    }

    try {
      // Update the company's FBR token
      const request = new sql.Request();

      const result = await request
        .input("id", sql.UniqueIdentifier, id)
        .input("fbrToken", sql.NVarChar(500), fbrToken.trim())
        .input("updatedAt", sql.DateTime, new Date()).query(`
        UPDATE Companies 
        SET FBRToken = @fbrToken, UpdatedAt = @updatedAt
        WHERE CompanyID = @id AND IsActive = 1
      `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "FBR token updated successfully",
        data: {
          companyId: id,
          fbrToken: fbrToken.trim(),
        },
      });
    } catch (error) {
      console.error("Error updating FBR token:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating FBR token",
      });
    }
  }
);

// Delete FBR token for a company
app.delete(
  "/api/companies/:id/fbr-token",
  authenticateToken,
  requireCompanyAccess,
  async (req, res) => {
    const { id } = req.params;

    try {
      // Clear the company's FBR token
      const request = new sql.Request();

      const result = await request
        .input("id", sql.UniqueIdentifier, id)
        .input("updatedAt", sql.DateTime, new Date()).query(`
        UPDATE Companies 
        SET FBRToken = NULL, UpdatedAt = @updatedAt
        WHERE CompanyID = @id AND IsActive = 1
      `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "FBR token cleared successfully",
        data: {
          companyId: id,
          fbrToken: null,
        },
      });
    } catch (error) {
      console.error("Error clearing FBR token:", error);
      res.status(500).json({
        success: false,
        message: "Server error while clearing FBR token",
      });
    }
  }
);

// FBR Invoice submission endpoint
app.post("/api/fbr/invoice", authenticateToken, async (req, res) => {
  try {
    const invoiceData = req.body;

    // Validate required fields
    const requiredFields = [
      "invoiceType",
      "invoiceDate",
      "sellerNTNCNIC",
      "sellerBusinessName",
      "sellerProvince",
      "sellerAddress",
      "buyerNTNCNIC",
      "buyerBusinessName",
      "buyerProvince",
      "buyerAddress",
      "buyerRegistrationType",
      "invoiceRefNo",
      "scenarioId",
      "items",
    ];

    for (const field of requiredFields) {
      if (!invoiceData[field]) {
        return res.status(400).json({
          status: "01",
          message: `Missing required field: ${field}`,
          errors: [`${field} is required`],
        });
      }
    }

    // In a real app, you would call the actual FBR API
    // For demo, we'll return a mock success response
    res.status(200).json({
      status: "00",
      message: "Invoice submitted successfully",
      invoiceNumber: `INV-${Date.now().toString().substring(5)}`,
    });
  } catch (error) {
    console.error("Error submitting invoice to FBR:", error);
    res.status(500).json({
      status: "01",
      message: "Server error while submitting invoice",
      errors: [error.message],
    });
  }
});

// Inventory API Routes

// Get all inventory items
app.get("/api/inventory", authenticateToken, async (req, res) => {
  try {
    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
      console.log(
        "Super admin requesting inventory for company ID:",
        companyId
      );
    }
    console.log(
      "Fetching inventory for company ID:",
      companyId,
      "User role:",
      req.user.role
    );

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("companyId", sql.UniqueIdentifier, companyId).query(`
        SELECT 
          InventoryID as id,
          ProductCode as productCode,
          ProductName as productName,
          Category as category,
          CurrentStock as currentStock,
          MinStock as minStock,
          UnitPrice as unitPrice,
          TotalValue as totalValue,
          UpdatedAt as lastUpdated
        FROM Inventory 
        WHERE CompanyID = @companyId AND IsActive = 1
        ORDER BY ProductName
      `);

    // Format the response to parse JSON fields
    const customers = result.recordset.map((customer) => ({
      ...customer,
      businessActivity: customer.BusinessActivity
        ? JSON.parse(customer.BusinessActivity)
        : [],
      sector: customer.Sector ? JSON.parse(customer.Sector) : [],
    }));

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
      error: error.message,
    });
  }
});

// Create new inventory item
app.post("/api/inventory", authenticateToken, async (req, res) => {
  const {
    productCode,
    productName,
    category,
    currentStock,
    minStock,
    unitPrice,
  } = req.body;

  // Validate required fields
  if (
    !productCode ||
    !productName ||
    !category ||
    currentStock === undefined ||
    minStock === undefined ||
    unitPrice === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("companyId", sql.UniqueIdentifier, req.user.companyId)
      .input("productCode", sql.NVarChar(50), productCode)
      .input("productName", sql.NVarChar(255), productName)
      .input("category", sql.NVarChar(100), category)
      .input("currentStock", sql.Int, currentStock)
      .input("minStock", sql.Int, minStock)
      .input("unitPrice", sql.Decimal(18, 2), unitPrice).query(`
        INSERT INTO Inventory (CompanyID, ProductCode, ProductName, Category, CurrentStock, MinStock, UnitPrice)
        OUTPUT INSERTED.InventoryID as id, INSERTED.ProductCode as productCode, INSERTED.ProductName as productName,
               INSERTED.Category as category, INSERTED.CurrentStock as currentStock, INSERTED.MinStock as minStock,
               INSERTED.UnitPrice as unitPrice, INSERTED.TotalValue as totalValue, INSERTED.UpdatedAt as lastUpdated
        VALUES (@companyId, @productCode, @productName, @category, @currentStock, @minStock, @unitPrice)
      `);

    res.status(201).json({
      success: true,
      data: result.recordset[0],
      message: "Inventory item created successfully",
    });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    if (error.number === 2627) {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        message: "Product code already exists for this company",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to create inventory item",
        error: error.message,
      });
    }
  }
});

// Update inventory item
app.put("/api/inventory/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    productCode,
    productName,
    category,
    currentStock,
    minStock,
    unitPrice,
  } = req.body;

  // Validate required fields
  if (
    !productCode ||
    !productName ||
    !category ||
    currentStock === undefined ||
    minStock === undefined ||
    unitPrice === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("inventoryId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, req.user.companyId)
      .input("productCode", sql.NVarChar(50), productCode)
      .input("productName", sql.NVarChar(255), productName)
      .input("category", sql.NVarChar(100), category)
      .input("currentStock", sql.Int, currentStock)
      .input("minStock", sql.Int, minStock)
      .input("unitPrice", sql.Decimal(18, 2), unitPrice).query(`
        UPDATE Inventory 
        SET ProductCode = @productCode,
            ProductName = @productName,
            Category = @category,
            CurrentStock = @currentStock,
            MinStock = @minStock,
            UnitPrice = @unitPrice,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.InventoryID as id, INSERTED.ProductCode as productCode, INSERTED.ProductName as productName,
               INSERTED.Category as category, INSERTED.CurrentStock as currentStock, INSERTED.MinStock as minStock,
               INSERTED.UnitPrice as unitPrice, INSERTED.TotalValue as totalValue, INSERTED.UpdatedAt as lastUpdated
        WHERE InventoryID = @inventoryId AND CompanyID = @companyId AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
      message: "Inventory item updated successfully",
    });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    if (error.number === 2627) {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        message: "Product code already exists for this company",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update inventory item",
        error: error.message,
      });
    }
  }
});

// Delete inventory item
app.delete("/api/inventory/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("inventoryId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, req.user.companyId).query(`
        UPDATE Inventory 
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE InventoryID = @inventoryId AND CompanyID = @companyId AND IsActive = 1
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    res.json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete inventory item",
      error: error.message,
    });
  }
});

// Items API Routes

// Get all items
app.get("/api/items", authenticateToken, async (req, res) => {
  try {
    console.log("=== ITEMS API DEBUG ===");
    console.log("All headers:", Object.keys(req.headers));
    console.log("X-Company-ID header:", req.headers["x-company-id"]);
    console.log("User info:", {
      role: req.user.role,
      companyId: req.user.companyId,
    });

    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      console.log(
        "Super admin requesting items for company ID:",
        req.headers["x-company-id"]
      );
      companyId = req.headers["x-company-id"];
    }

    console.log(
      "Final companyId to use:",
      companyId,
      "Type:",
      typeof companyId
    );
    console.log("=== END ITEMS DEBUG ===");

    if (isDbConnected) {
      const pool = await sql.connect(dbConfig);
      const result = await pool
        .request()
        .input("companyId", sql.UniqueIdentifier, companyId).query(`
          SELECT 
            ItemID as itemId,
            HSCode as hsCode,
            Description as description,
            UnitPrice as unitPrice,
            PurchaseTaxValue as purchaseTaxValue,
            SalesTaxValue as salesTaxValue,
            UoM as uom,
            IsActive as isActive,
            ItemCreateDate as itemCreateDate,
            CompanyID as companyId
          FROM Items 
          WHERE CompanyID = @companyId
          ORDER BY ItemCreateDate DESC
        `);

      res.json({
        success: true,
        data: result.recordset,
      });
    } else {
      // Mock data for demo
      const mockItems = [
        {
          itemId: "1",
          hsCode: "8471.30.00",
          description: "Portable digital automatic data processing machines",
          unitPrice: 1500.0,
          purchaseTaxValue: 17.0,
          salesTaxValue: 17.0,
          uom: "PCS",
          isActive: true,
          itemCreateDate: new Date().toISOString(),
          companyId: companyId,
        },
        {
          itemId: "2",
          hsCode: "8528.72.10",
          description: "LCD monitors and displays",
          unitPrice: 300.0,
          purchaseTaxValue: 17.0,
          salesTaxValue: 17.0,
          uom: "PCS",
          isActive: true,
          itemCreateDate: new Date().toISOString(),
          companyId: companyId,
        },
      ];

      res.json({
        success: true,
        data: mockItems,
      });
    }
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch items",
      error: error.message,
    });
  }
});

// Create new item
app.post("/api/items", authenticateToken, async (req, res) => {
  try {
    const {
      hsCode,
      description,
      unitPrice,
      purchaseTaxValue,
      salesTaxValue,
      uom,
    } = req.body;

    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
    }

    if (!hsCode || !description || unitPrice === undefined || !uom) {
      return res.status(400).json({
        success: false,
        message: "HSCode, description, unitPrice, and UoM are required",
      });
    }

    if (isDbConnected) {
      const pool = await sql.connect(dbConfig);
      const result = await pool
        .request()
        .input("hsCode", sql.VarChar(50), hsCode)
        .input("description", sql.Text, description)
        .input("unitPrice", sql.Decimal(18, 2), unitPrice)
        .input("purchaseTaxValue", sql.Decimal(5, 2), purchaseTaxValue || 0)
        .input("salesTaxValue", sql.Decimal(5, 2), salesTaxValue || 0)
        .input("uom", sql.VarChar(20), uom)
        .input("companyId", sql.UniqueIdentifier, companyId)
        .input("createdBy", sql.UniqueIdentifier, req.user.userId).query(`
          INSERT INTO Items (HSCode, Description, UnitPrice, PurchaseTaxValue, SalesTaxValue, UoM, CompanyID, CreatedBy, ItemCreateDate, IsActive)
          OUTPUT INSERTED.ItemID, INSERTED.HSCode, INSERTED.Description, INSERTED.UnitPrice, 
                 INSERTED.PurchaseTaxValue, INSERTED.SalesTaxValue, INSERTED.UoM, INSERTED.IsActive, INSERTED.ItemCreateDate
          VALUES (@hsCode, @description, @unitPrice, @purchaseTaxValue, @salesTaxValue, @uom, @companyId, @createdBy, GETDATE(), 1)
        `);

      res.status(201).json({
        success: true,
        message: "Item created successfully",
        data: result.recordset[0],
      });
    } else {
      // Mock response for demo
      const newItem = {
        itemId: Date.now().toString(),
        hsCode,
        description,
        unitPrice,
        purchaseTaxValue: purchaseTaxValue || 0,
        salesTaxValue: salesTaxValue || 0,
        uom,
        isActive: true,
        itemCreateDate: new Date().toISOString(),
        companyId: companyId,
      };

      res.status(201).json({
        success: true,
        message: "Item created successfully",
        data: newItem,
      });
    }
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create item",
      error: error.message,
    });
  }
});

// Update item
app.put("/api/items/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hsCode,
      description,
      unitPrice,
      purchaseTaxValue,
      salesTaxValue,
      uom,
    } = req.body;

    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
    }

    if (!hsCode || !description || unitPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "HSCode, description, and unitPrice are required",
      });
    }

    if (isDbConnected) {
      const pool = await sql.connect(dbConfig);
      const result = await pool
        .request()
        .input("itemId", sql.UniqueIdentifier, id)
        .input("hsCode", sql.VarChar(50), hsCode)
        .input("description", sql.Text, description)
        .input("unitPrice", sql.Decimal(18, 2), unitPrice)
        .input("purchaseTaxValue", sql.Decimal(5, 2), purchaseTaxValue || 0)
        .input("salesTaxValue", sql.Decimal(5, 2), salesTaxValue || 0)
        .input("uom", sql.VarChar(20), uom)
        .input("companyId", sql.UniqueIdentifier, companyId).query(`
          UPDATE Items 
          SET HSCode = @hsCode,
              Description = @description,
              UnitPrice = @unitPrice,
              PurchaseTaxValue = @purchaseTaxValue,
              SalesTaxValue = @salesTaxValue,
              UoM = @uom
          OUTPUT INSERTED.ItemID, INSERTED.HSCode, INSERTED.Description, INSERTED.UnitPrice,
                 INSERTED.PurchaseTaxValue, INSERTED.SalesTaxValue, INSERTED.UoM, INSERTED.IsActive, INSERTED.ItemCreateDate
          WHERE ItemID = @itemId AND CompanyID = @companyId
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Item not found or access denied",
        });
      }

      res.json({
        success: true,
        message: "Item updated successfully",
        data: result.recordset[0],
      });
    } else {
      // Mock response for demo
      const updatedItem = {
        itemId: id,
        hsCode,
        description,
        unitPrice,
        purchaseTaxValue: purchaseTaxValue || 0,
        salesTaxValue: salesTaxValue || 0,
        isActive: true,
        itemCreateDate: new Date().toISOString(),
        companyId: companyId,
      };

      res.json({
        success: true,
        message: "Item updated successfully",
        data: updatedItem,
      });
    }
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update item",
      error: error.message,
    });
  }
});

// Delete item
app.delete("/api/items/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
    }

    if (isDbConnected) {
      const pool = await sql.connect(dbConfig);
      const result = await pool
        .request()
        .input("itemId", sql.UniqueIdentifier, id)
        .input("companyId", sql.UniqueIdentifier, companyId).query(`
          DELETE FROM Items 
          WHERE ItemID = @itemId AND CompanyID = @companyId
        `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          success: false,
          message: "Item not found or access denied",
        });
      }

      res.json({
        success: true,
        message: "Item deleted successfully",
      });
    } else {
      // Mock response for demo
      res.json({
        success: true,
        message: "Item deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete item",
      error: error.message,
    });
  }
});

// Purchases API Routes

// Get all purchases
app.get("/api/purchases", authenticateToken, async (req, res) => {
  try {
    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
      console.log(
        "Super admin requesting purchases for company ID:",
        companyId
      );
    }
    console.log(
      "Fetching purchases for company ID:",
      companyId,
      "User role:",
      req.user.role
    );

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("companyId", sql.UniqueIdentifier, companyId).query(`
        SELECT 
          p.PurchaseID as id,
          p.PONumber as poNumber,
          p.PODate as poDate,
          p.CRNumber as crNumber,
          p.Date as date,
          p.VendorID as vendorId,
          p.VendorName as vendorName,
          p.TotalAmount as totalAmount,
          p.Status as status,
          p.CreatedAt as createdAt,
          items.Items
        FROM Purchases p
        OUTER APPLY (
          SELECT 
            ItemID as itemId,
            ItemName as itemName,
            PurchasePrice as purchasePrice,
            PurchaseQty as purchaseQty,
            TotalAmount as totalAmount
          FROM PurchaseItems pi
          WHERE pi.PurchaseID = p.PurchaseID
          FOR JSON PATH
        ) AS items(Items)
        WHERE p.CompanyID = @companyId AND p.IsActive = 1
        ORDER BY p.CreatedAt DESC
      `);

    const purchases = result.recordset.map((purchase) => ({
      ...purchase,
      items: purchase.Items ? JSON.parse(purchase.Items) : [],
    }));

    res.json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
});

// Create new purchase
app.post("/api/purchases", authenticateToken, async (req, res) => {
  const {
    poNumber,
    poDate,
    crNumber,
    date,
    vendorId,
    vendorName,
    items,
    totalAmount,
    status,
  } = req.body;

  console.log("=== PURCHASE CREATION DEBUG ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("vendorId:", vendorId);
  console.log("vendorName:", vendorName);
  console.log("================================");

  // For super admin, use company ID from header if provided, otherwise use user's company
  let companyId = req.user.companyId;
  if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
    companyId = req.headers["x-company-id"];
  }

  const transaction = new sql.Transaction();

  try {
    await transaction.begin();

    // Insert purchase
    const purchaseResult = await transaction
      .request()
      .input("companyId", sql.UniqueIdentifier, companyId)
      .input("poNumber", sql.NVarChar, poNumber)
      .input("poDate", sql.Date, poDate)
      .input("crNumber", sql.NVarChar, crNumber)
      .input("date", sql.Date, date)
      .input("vendorId", sql.UniqueIdentifier, vendorId)
      .input("vendorName", sql.NVarChar, vendorName)
      .input("totalAmount", sql.Decimal(18, 2), totalAmount)
      .input("status", sql.NVarChar, status || "pending")
      .input("createdBy", sql.UniqueIdentifier, req.user.userId).query(`
        INSERT INTO Purchases (
          CompanyID, PONumber, PODate, CRNumber, Date, VendorID, VendorName, TotalAmount, Status, CreatedBy
        )
        OUTPUT INSERTED.PurchaseID
        VALUES (
          @companyId, @poNumber, @poDate, @crNumber, @date, @vendorId, @vendorName, @totalAmount, @status, @createdBy
        )
      `);

    const purchaseId = purchaseResult.recordset[0].PurchaseID;

    // Insert purchase items
    for (const item of items) {
      await transaction
        .request()
        .input("purchaseId", sql.UniqueIdentifier, purchaseId)
        .input("itemId", sql.UniqueIdentifier, item.itemId)
        .input("itemName", sql.NVarChar, item.itemName)
        .input("purchasePrice", sql.Decimal(18, 2), item.purchasePrice)
        .input("purchaseQty", sql.Int, item.purchaseQty)
        .input("totalAmount", sql.Decimal(18, 2), item.totalAmount).query(`
          INSERT INTO PurchaseItems (
            PurchaseID, ItemID, ItemName, PurchasePrice, PurchaseQty, TotalAmount
          )
          VALUES (
            @purchaseId, @itemId, @itemName, @purchasePrice, @purchaseQty, @totalAmount
          )
        `);
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: { id: purchaseId },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating purchase:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create purchase",
      error: error.message,
    });
  }
});

// Update purchase
app.put("/api/purchases/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    poNumber,
    poDate,
    crNumber,
    date,
    vendorId,
    vendorName,
    items,
    totalAmount,
    status,
  } = req.body;

  // For super admin, use company ID from header if provided, otherwise use user's company
  let companyId = req.user.companyId;
  if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
    companyId = req.headers["x-company-id"];
  }

  const transaction = new sql.Transaction();

  try {
    await transaction.begin();

    // Update purchase
    const purchaseResult = await transaction
      .request()
      .input("purchaseId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, companyId)
      .input("poNumber", sql.NVarChar, poNumber)
      .input("poDate", sql.Date, poDate)
      .input("crNumber", sql.NVarChar, crNumber)
      .input("date", sql.Date, date)
      .input("vendorId", sql.UniqueIdentifier, vendorId)
      .input("vendorName", sql.NVarChar, vendorName)
      .input("totalAmount", sql.Decimal(18, 2), totalAmount)
      .input("status", sql.NVarChar, status).query(`
        UPDATE Purchases SET
          PONumber = @poNumber,
          PODate = @poDate,
          CRNumber = @crNumber,
          Date = @date,
          VendorID = @vendorId,
          VendorName = @vendorName,
          TotalAmount = @totalAmount,
          Status = @status,
          UpdatedAt = GETDATE()
        WHERE PurchaseID = @purchaseId AND CompanyID = @companyId AND IsActive = 1
      `);

    if (purchaseResult.rowsAffected[0] === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // Delete existing purchase items
    await transaction
      .request()
      .input("purchaseId", sql.UniqueIdentifier, id)
      .query("DELETE FROM PurchaseItems WHERE PurchaseID = @purchaseId");

    // Insert updated purchase items
    for (const item of items) {
      await transaction
        .request()
        .input("purchaseId", sql.UniqueIdentifier, id)
        .input("itemId", sql.UniqueIdentifier, item.itemId)
        .input("itemName", sql.NVarChar, item.itemName)
        .input("purchasePrice", sql.Decimal(18, 2), item.purchasePrice)
        .input("purchaseQty", sql.Int, item.purchaseQty)
        .input("totalAmount", sql.Decimal(18, 2), item.totalAmount).query(`
          INSERT INTO PurchaseItems (
            PurchaseID, ItemID, ItemName, PurchasePrice, PurchaseQty, TotalAmount
          )
          VALUES (
            @purchaseId, @itemId, @itemName, @purchasePrice, @purchaseQty, @totalAmount
          )
        `);
    }

    await transaction.commit();

    res.json({
      success: true,
      message: "Purchase updated successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating purchase:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update purchase",
      error: error.message,
    });
  }
});

// Delete purchase
app.delete("/api/purchases/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  // For super admin, use company ID from header if provided, otherwise use user's company
  let companyId = req.user.companyId;
  if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
    companyId = req.headers["x-company-id"];
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("purchaseId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, companyId).query(`
        UPDATE Purchases 
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE PurchaseID = @purchaseId AND CompanyID = @companyId AND IsActive = 1
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    res.json({
      success: true,
      message: "Purchase deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete purchase",
      error: error.message,
    });
  }
});

// Get purchase by ID
app.get("/api/purchases/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  // For super admin, use company ID from header if provided, otherwise use user's company
  let companyId = req.user.companyId;
  if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
    companyId = req.headers["x-company-id"];
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("purchaseId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, companyId).query(`
        SELECT 
          p.PurchaseID as id,
          p.PONumber as poNumber,
          p.PODate as poDate,
          p.VendorID as vendorId,
          p.VendorName as vendorName,
          p.TotalAmount as totalAmount,
          p.Status as status,
          p.CreatedAt as createdAt,
          items.Items
        FROM Purchases p
        OUTER APPLY (
          SELECT 
            ItemID as itemId,
            ItemName as itemName,
            PurchasePrice as purchasePrice,
            PurchaseQty as purchaseQty,
            TotalAmount as totalAmount
          FROM PurchaseItems pi
          WHERE pi.PurchaseID = p.PurchaseID
          FOR JSON PATH
        ) AS items(Items)
        WHERE p.PurchaseID = @purchaseId AND p.CompanyID = @companyId AND p.IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    const purchase = {
      ...result.recordset[0],
      items: result.recordset[0].Items
        ? JSON.parse(result.recordset[0].Items)
        : [],
    };

    res.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase",
      error: error.message,
    });
  }
});

// Customer API Routes

// Get all customers
app.get("/api/customers", authenticateToken, async (req, res) => {
  try {
    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
      console.log(
        "Super admin requesting customers for company ID:",
        companyId
      );
    }
    console.log(
      "Fetching customers for company ID:",
      companyId,
      "User role:",
      req.user.role
    );

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("companyId", sql.UniqueIdentifier, companyId).query(`
        SELECT 
          CustomerID as id,
          Buyer_NTNCNIC as buyerNTNCNIC,
          Buyer_Business_Name as buyerBusinessName,
          Buyer_Province as buyerProvince,
          Buyer_Address as buyerAddress,
          Buyer_RegistrationType as buyerRegistrationType,
          Buyer_RegistrationNo as buyerRegistrationNo,
          Buyer_Email as buyerEmail,
          Buyer_Cellphone as buyerCellphone,
          ContactPersonName as contactPersonName,
          BusinessActivity,
          Sector,
          IsActive as isActive,
          CreatedAt as createdAt,
          UpdatedAt as updatedAt
        FROM Customers 
        WHERE CompanyID = @companyId AND IsActive = 1
        ORDER BY CreatedAt DESC
      `);

    const formattedVendors = result.recordset.map((vendor) => ({
      ...vendor,
      businessActivity: vendor.BusinessActivity
        ? JSON.parse(vendor.BusinessActivity)
        : [],
      sector: vendor.Sector ? JSON.parse(vendor.Sector) : [],
    }));

    res.json({
      success: true,
      data: formattedVendors,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
});

// Create new customer
app.post("/api/customers", authenticateToken, async (req, res) => {
  try {
    const {
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      buyerRegistrationNo,
      buyerEmail,
      buyerCellphone,
      contactPersonName,
      businessActivity,
      sector,
    } = req.body;

    if (
      !buyerNTNCNIC ||
      !buyerBusinessName ||
      !buyerProvince ||
      !buyerAddress ||
      !buyerRegistrationType
    ) {
      return res.status(400).json({
        success: false,
        message: "Required customer fields are missing",
      });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("companyId", sql.UniqueIdentifier, req.user.companyId)
      .input("buyerNTNCNIC", sql.NVarChar(20), buyerNTNCNIC)
      .input("buyerBusinessName", sql.NVarChar(100), buyerBusinessName)
      .input("buyerProvince", sql.NVarChar(50), buyerProvince)
      .input("buyerAddress", sql.NVarChar(255), buyerAddress)
      .input("buyerRegistrationType", sql.NVarChar(20), buyerRegistrationType)
      .input(
        "buyerRegistrationNo",
        sql.NVarChar(50),
        buyerRegistrationNo || null
      )
      .input("buyerEmail", sql.NVarChar(100), buyerEmail || null)
      .input("buyerCellphone", sql.NVarChar(20), buyerCellphone || null)
      .input("contactPersonName", sql.NVarChar(255), contactPersonName || null)
      .input(
        "businessActivity",
        sql.NVarChar(sql.MAX),
        businessActivity ? JSON.stringify(businessActivity) : null
      )
      .input(
        "sector",
        sql.NVarChar(sql.MAX),
        sector ? JSON.stringify(sector) : null
      ).query(`
        INSERT INTO Customers (CompanyID, Buyer_NTNCNIC, Buyer_Business_Name, Buyer_Province, Buyer_Address, Buyer_RegistrationType, Buyer_RegistrationNo, Buyer_Email, Buyer_Cellphone, ContactPersonName, BusinessActivity, Sector)
        OUTPUT INSERTED.CustomerID, INSERTED.Buyer_NTNCNIC, INSERTED.Buyer_Business_Name, INSERTED.Buyer_Province, INSERTED.Buyer_Address, INSERTED.Buyer_RegistrationType, INSERTED.Buyer_RegistrationNo, INSERTED.Buyer_Email, INSERTED.Buyer_Cellphone, INSERTED.ContactPersonName, INSERTED.BusinessActivity, INSERTED.Sector, INSERTED.CreatedAt
        VALUES (@companyId, @buyerNTNCNIC, @buyerBusinessName, @buyerProvince, @buyerAddress, @buyerRegistrationType, @buyerRegistrationNo, @buyerEmail, @buyerCellphone, @contactPersonName, @businessActivity, @sector)
      `);

    const newCustomer = result.recordset[0];
    const formattedCustomer = {
      ...newCustomer,
      businessActivity: newCustomer.BusinessActivity
        ? JSON.parse(newCustomer.BusinessActivity)
        : [],
      sector: newCustomer.Sector ? JSON.parse(newCustomer.Sector) : [],
    };

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: formattedCustomer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error.message,
    });
  }
});

// Update customer
app.put("/api/customers/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      buyerRegistrationNo,
      buyerEmail,
      buyerCellphone,
      contactPersonName,
      businessActivity,
      sector,
    } = req.body;

    if (
      !buyerNTNCNIC ||
      !buyerBusinessName ||
      !buyerProvince ||
      !buyerAddress ||
      !buyerRegistrationType
    ) {
      return res.status(400).json({
        success: false,
        message: "Required customer fields are missing",
      });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("customerId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, req.user.companyId)
      .input("buyerNTNCNIC", sql.NVarChar(20), buyerNTNCNIC)
      .input("buyerBusinessName", sql.NVarChar(100), buyerBusinessName)
      .input("buyerProvince", sql.NVarChar(50), buyerProvince)
      .input("buyerAddress", sql.NVarChar(255), buyerAddress)
      .input("buyerRegistrationType", sql.NVarChar(20), buyerRegistrationType)
      .input(
        "buyerRegistrationNo",
        sql.NVarChar(50),
        buyerRegistrationNo || null
      )
      .input("buyerEmail", sql.NVarChar(100), buyerEmail || null)
      .input("buyerCellphone", sql.NVarChar(20), buyerCellphone || null)
      .input("contactPersonName", sql.NVarChar(255), contactPersonName || null)
      .input(
        "businessActivity",
        sql.NVarChar(sql.MAX),
        businessActivity ? JSON.stringify(businessActivity) : null
      )
      .input(
        "sector",
        sql.NVarChar(sql.MAX),
        sector ? JSON.stringify(sector) : null
      ).query(`
        UPDATE Customers 
        SET 
          Buyer_NTNCNIC = @buyerNTNCNIC,
          Buyer_Business_Name = @buyerBusinessName,
          Buyer_Province = @buyerProvince,
          Buyer_Address = @buyerAddress,
          Buyer_RegistrationType = @buyerRegistrationType,
          Buyer_RegistrationNo = @buyerRegistrationNo,
          Buyer_Email = @buyerEmail,
          Buyer_Cellphone = @buyerCellphone,
          ContactPersonName = @contactPersonName,
          BusinessActivity = @businessActivity,
          Sector = @sector,
          UpdatedAt = GETDATE()
        OUTPUT INSERTED.CustomerID, INSERTED.Buyer_NTNCNIC, INSERTED.Buyer_Business_Name, INSERTED.Buyer_Province, INSERTED.Buyer_Address, INSERTED.Buyer_RegistrationType, INSERTED.Buyer_RegistrationNo, INSERTED.Buyer_Email, INSERTED.Buyer_Cellphone, INSERTED.ContactPersonName, INSERTED.BusinessActivity, INSERTED.Sector, INSERTED.UpdatedAt
        WHERE CustomerID = @customerId AND CompanyID = @companyId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const updatedCustomer = result.recordset[0];
    const formattedCustomer = {
      ...updatedCustomer,
      businessActivity: updatedCustomer.BusinessActivity
        ? JSON.parse(updatedCustomer.BusinessActivity)
        : [],
      sector: updatedCustomer.Sector ? JSON.parse(updatedCustomer.Sector) : [],
    };

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: formattedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error.message,
    });
  }
});

// Delete customer
app.delete("/api/customers/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("customerId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, req.user.companyId).query(`
        UPDATE Customers 
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE CustomerID = @customerId AND CompanyID = @companyId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: error.message,
    });
  }
});

// Vendor API Routes

// Helper function to validate GUID format
function isValidGuid(guid) {
  if (!guid || typeof guid !== "string") return false;
  const guidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return guidRegex.test(guid);
}

// Get all vendors
app.get("/api/vendors", authenticateToken, async (req, res) => {
  try {
    // Debug logging for headers and user info
    console.log("=== VENDORS API DEBUG ===");
    console.log("All headers:", Object.keys(req.headers));
    console.log("X-Company-ID header:", req.headers["x-company-id"]);
    console.log("User info:", {
      role: req.user.role,
      companyId: req.user.companyId,
    });

    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
      console.log("Super admin requesting vendors for company ID:", companyId);
    }
    console.log(
      "Final companyId to use:",
      companyId,
      "Type:",
      typeof companyId
    );

    // Validate GUID format
    if (!isValidGuid(companyId)) {
      console.log("Invalid GUID format:", companyId);
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format. Must be a valid GUID.",
      });
    }

    console.log("=== END VENDORS DEBUG ===");

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("companyId", sql.UniqueIdentifier, companyId).query(`
        SELECT 
          VendorID as vendorId,
          CompanyID as companyId,
          VendorName as vendorName,
          VendorNTN as vendorNTN,
          VendorCNIC as vendorCNIC,
          ContactPersonName as contactPersonName,
          VendorAddress as vendorAddress,
          VendorPhone as vendorPhone,
          VendorEmail as vendorEmail,
          BusinessActivity,
          Sector,
          IsActive as isActive,
          CreatedAt as createdAt,
          UpdatedAt as updatedAt
        FROM Vendors 
        WHERE CompanyID = @companyId AND IsActive = 1
        ORDER BY CreatedAt DESC
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message,
    });
  }
});

// Create new vendor
app.post("/api/vendors", authenticateToken, async (req, res) => {
  try {
    const {
      vendorName,
      vendorNTN,
      vendorCNIC,
      contactPersonName,
      vendorAddress,
      vendorPhone,
      vendorEmail,
      businessActivity,
      sector,
    } = req.body;

    if (
      !vendorName ||
      !vendorNTN ||
      !vendorAddress ||
      !vendorPhone ||
      !vendorEmail
    ) {
      return res.status(400).json({
        success: false,
        message: "Required vendor fields are missing",
      });
    }

    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
    }

    // Validate GUID format for companyId
    if (companyId && !isValidGuid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format",
      });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("companyId", sql.UniqueIdentifier, companyId)
      .input("vendorName", sql.NVarChar(255), vendorName)
      .input("vendorNTN", sql.NVarChar(50), vendorNTN)
      .input("vendorCNIC", sql.NVarChar(15), vendorCNIC || null)
      .input("contactPersonName", sql.NVarChar(255), contactPersonName || null)
      .input("vendorAddress", sql.NVarChar(500), vendorAddress)
      .input("vendorPhone", sql.NVarChar(20), vendorPhone)
      .input("vendorEmail", sql.NVarChar(255), vendorEmail)
      .input("createdBy", sql.UniqueIdentifier, req.user.userId)
      .input(
        "businessActivity",
        sql.NVarChar(sql.MAX),
        businessActivity ? JSON.stringify(businessActivity) : null
      )
      .input(
        "sector",
        sql.NVarChar(sql.MAX),
        sector ? JSON.stringify(sector) : null
      ).query(`
        INSERT INTO Vendors (
          CompanyID, VendorName, VendorNTN, VendorCNIC, ContactPersonName, VendorAddress, VendorPhone, VendorEmail, BusinessActivity, Sector, CreatedBy
        )
        OUTPUT INSERTED.VendorID
        VALUES (
          @companyId, @vendorName, @vendorNTN, @vendorCNIC, @contactPersonName, @vendorAddress, @vendorPhone, @vendorEmail, @businessActivity, @sector, @createdBy
        )
      `);

    res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: { id: result.recordset[0].VendorID },
    });
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create vendor",
      error: error.message,
    });
  }
});

// Update vendor
app.put("/api/vendors/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vendorName,
      vendorNTN,
      vendorCNIC,
      contactPersonName,
      vendorAddress,
      vendorPhone,
      vendorEmail,
      businessActivity,
      sector,
    } = req.body;

    if (
      !vendorName ||
      !vendorNTN ||
      !vendorAddress ||
      !vendorPhone ||
      !vendorEmail
    ) {
      return res.status(400).json({
        success: false,
        message: "Required vendor fields are missing",
      });
    }

    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("vendorId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, companyId)
      .input("vendorName", sql.NVarChar(255), vendorName)
      .input("vendorNTN", sql.NVarChar(50), vendorNTN)
      .input("vendorCNIC", sql.NVarChar(15), vendorCNIC || null)
      .input("contactPersonName", sql.NVarChar(255), contactPersonName || null)
      .input("vendorAddress", sql.NVarChar(500), vendorAddress)
      .input("vendorPhone", sql.NVarChar(20), vendorPhone)
      .input("vendorEmail", sql.NVarChar(255), vendorEmail)
      .input(
        "businessActivity",
        sql.NVarChar(sql.MAX),
        businessActivity ? JSON.stringify(businessActivity) : null
      )
      .input(
        "sector",
        sql.NVarChar(sql.MAX),
        sector ? JSON.stringify(sector) : null
      ).query(`
        UPDATE Vendors 
        SET 
          VendorName = @vendorName,
          VendorNTN = @vendorNTN,
          VendorCNIC = @vendorCNIC,
          ContactPersonName = @contactPersonName,
          VendorAddress = @vendorAddress,
          VendorPhone = @vendorPhone,
          VendorEmail = @vendorEmail,
          BusinessActivity = @businessActivity,
          Sector = @sector,
          UpdatedAt = GETDATE()
        WHERE VendorID = @vendorId AND CompanyID = @companyId AND IsActive = 1
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.json({
      success: true,
      message: "Vendor updated successfully",
    });
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vendor",
      error: error.message,
    });
  }
});

// Delete vendor
app.delete("/api/vendors/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("vendorId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, companyId).query(`
        UPDATE Vendors 
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE VendorID = @vendorId AND CompanyID = @companyId AND IsActive = 1
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vendor",
      error: error.message,
    });
  }
});

// Get single vendor
app.get("/api/vendors/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // For super admin, use company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("vendorId", sql.UniqueIdentifier, id)
      .input("companyId", sql.UniqueIdentifier, companyId).query(`
        SELECT VendorID as vendorId, CompanyID as companyId, VendorName as vendorName, 
               VendorNTN as vendorNTN, VendorCNIC as vendorCNIC, ContactPersonName as contactPersonName,
               VendorAddress as vendorAddress, VendorPhone as vendorPhone, 
               VendorEmail as vendorEmail, BusinessActivity, Sector, IsActive as isActive, CreatedBy as createdBy, 
               CreatedAt as createdAt, UpdatedAt as updatedAt
        FROM Vendors 
        WHERE VendorID = @vendorId AND CompanyID = @companyId AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const vendor = result.recordset[0];
    const formattedVendor = {
      ...vendor,
      businessActivity: vendor.BusinessActivity
        ? JSON.parse(vendor.BusinessActivity)
        : [],
      sector: vendor.Sector ? JSON.parse(vendor.Sector) : [],
    };

    res.json({
      success: true,
      data: formattedVendor,
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor",
      error: error.message,
    });
  }
});

// Toggle vendor status
app.patch(
  "/api/vendors/:id/toggle-status",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      // For super admin, use company ID from header if provided, otherwise use user's company
      let companyId = req.user.companyId;
      if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
        companyId = req.headers["x-company-id"];
      }

      const pool = await sql.connect(dbConfig);
      const result = await pool
        .request()
        .input("vendorId", sql.UniqueIdentifier, id)
        .input("companyId", sql.UniqueIdentifier, companyId).query(`
        UPDATE Vendors 
        SET IsActive = CASE WHEN IsActive = 1 THEN 0 ELSE 1 END, UpdatedAt = GETDATE()
        WHERE VendorID = @vendorId AND CompanyID = @companyId
      `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      res.json({
        success: true,
        message: "Vendor status updated successfully",
      });
    } catch (error) {
      console.error("Error toggling vendor status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle vendor status",
        error: error.message,
      });
    }
  }
);

// Reports API Endpoints
app.get("/api/reports/sales", authenticateToken, async (req, res) => {
  try {
    const {
      reportType = "sales",
      dateRange = "monthly",
      startDate,
      endDate,
    } = req.query;
    const companyId = req.user.companyId;

    if (isDbConnected) {
      const pool = await sql.connect(dbConfig);

      // Get sales data based on date range
      let dateFilter = "";
      if (dateRange === "custom" && startDate && endDate) {
        dateFilter = `AND i.InvoiceDate BETWEEN '${startDate}' AND '${endDate}'`;
      } else {
        // Default to last 12 months
        dateFilter = `AND i.InvoiceDate >= DATEADD(month, -12, GETDATE())`;
      }

      const salesQuery = `
        SELECT 
          FORMAT(i.InvoiceDate, 'yyyy-MM') as period,
          SUM(i.TotalAmount) as sales,
          COUNT(*) as orders,
          SUM(i.TotalAmount * 0.1) as profit
        FROM Invoices i
        WHERE i.CompanyID = @companyId ${dateFilter}
        GROUP BY FORMAT(i.InvoiceDate, 'yyyy-MM')
        ORDER BY period DESC
      `;

      const salesResult = await pool
        .request()
        .input("companyId", sql.UniqueIdentifier, companyId)
        .query(salesQuery);

      // Get top products
      const topProductsQuery = `
        SELECT TOP 5
          ii.ProductName as name,
          SUM(ii.Quantity) as quantity,
          SUM(ii.TotalAmount) as sales,
          CAST(SUM(ii.TotalAmount) * 100.0 / (SELECT SUM(TotalAmount) FROM InvoiceItems WHERE InvoiceID IN (SELECT InvoiceID FROM Invoices WHERE CompanyID = @companyId)) AS DECIMAL(5,2)) as percentage
        FROM InvoiceItems ii
        INNER JOIN Invoices i ON ii.InvoiceID = i.InvoiceID
        WHERE i.CompanyID = @companyId ${dateFilter}
        GROUP BY ii.ProductName
        ORDER BY sales DESC
      `;

      const topProductsResult = await pool
        .request()
        .input("companyId", sql.UniqueIdentifier, companyId)
        .query(topProductsQuery);

      // Get top customers
      const topCustomersQuery = `
        SELECT TOP 5
          c.BuyerBusinessName as name,
          SUM(i.TotalAmount) as amount,
          COUNT(*) as orders,
          CAST(SUM(i.TotalAmount) * 100.0 / (SELECT SUM(TotalAmount) FROM Invoices WHERE CompanyID = @companyId) AS DECIMAL(5,2)) as percentage
        FROM Invoices i
        INNER JOIN Customers c ON i.CustomerID = c.CustomerID
        WHERE i.CompanyID = @companyId ${dateFilter}
        GROUP BY c.BuyerBusinessName
        ORDER BY amount DESC
      `;

      const topCustomersResult = await pool
        .request()
        .input("companyId", sql.UniqueIdentifier, companyId)
        .query(topCustomersQuery);

      res.json({
        success: true,
        data: {
          salesData: salesResult.recordset.map((row) => ({
            period: row.period,
            sales: parseFloat(row.sales) || 0,
            purchases: parseFloat(row.sales) * 0.7 || 0, // Mock purchases as 70% of sales
            profit: parseFloat(row.profit) || 0,
            orders: row.orders || 0,
          })),
          topProducts: topProductsResult.recordset,
          topCustomers: topCustomersResult.recordset,
        },
      });
    } else {
      // Mock data when database is not connected
      const mockSalesData = [
        {
          period: "2024-01",
          sales: 125000,
          purchases: 87500,
          profit: 12500,
          orders: 45,
        },
        {
          period: "2024-02",
          sales: 135000,
          purchases: 94500,
          profit: 13500,
          orders: 52,
        },
        {
          period: "2024-03",
          sales: 142000,
          purchases: 99400,
          profit: 14200,
          orders: 48,
        },
        {
          period: "2024-04",
          sales: 158000,
          purchases: 110600,
          profit: 15800,
          orders: 61,
        },
        {
          period: "2024-05",
          sales: 167000,
          purchases: 116900,
          profit: 16700,
          orders: 55,
        },
        {
          period: "2024-06",
          sales: 175000,
          purchases: 122500,
          profit: 17500,
          orders: 63,
        },
      ];

      const mockTopProducts = [
        { name: "Product A", quantity: 150, sales: 45000, percentage: 25.5 },
        { name: "Product B", quantity: 120, sales: 36000, percentage: 20.4 },
        { name: "Product C", quantity: 95, sales: 28500, percentage: 16.2 },
        { name: "Product D", quantity: 80, sales: 24000, percentage: 13.6 },
        { name: "Product E", quantity: 65, sales: 19500, percentage: 11.1 },
      ];

      const mockTopCustomers = [
        {
          name: "ABC Corporation",
          amount: 85000,
          orders: 12,
          percentage: 28.3,
        },
        { name: "XYZ Industries", amount: 67000, orders: 9, percentage: 22.3 },
        {
          name: "Tech Solutions Ltd",
          amount: 52000,
          orders: 8,
          percentage: 17.3,
        },
        { name: "Global Traders", amount: 43000, orders: 6, percentage: 14.3 },
        {
          name: "Prime Enterprises",
          amount: 38000,
          orders: 7,
          percentage: 12.7,
        },
      ];

      res.json({
        success: true,
        data: {
          salesData: mockSalesData,
          topProducts: mockTopProducts,
          topCustomers: mockTopCustomers,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching reports data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports data",
      error: error.message,
    });
  }
});

// Dashboard API Endpoints
app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
  try {
    // For super admin, use the company ID from header if provided, otherwise use user's company
    let companyId = req.user.companyId;
    if (req.user.role === "SUPER_ADMIN" && req.headers["x-company-id"]) {
      companyId = req.headers["x-company-id"];
    }

    if (isDbConnected) {
      const pool = await sql.connect(dbConfig);

      // Get dashboard statistics
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM Invoices WHERE CompanyID = @companyId) as totalInvoices,
          (SELECT ISNULL(SUM(TotalAmount), 0) FROM Invoices WHERE CompanyID = @companyId) as totalAmount,
          (SELECT ISNULL(SUM(TotalSalesTax), 0) FROM Invoices WHERE CompanyID = @companyId) as totalTax,
          (SELECT COUNT(*) FROM Inventory WHERE CompanyID = @companyId) as totalInventory,
          (SELECT COUNT(*) FROM Customers WHERE CompanyID = @companyId) as totalCustomers
      `;

      const statsResult = await pool
        .request()
        .input("companyId", sql.UniqueIdentifier, companyId)
        .query(statsQuery);

      // Get recent activities (last 10 invoices)
      const activitiesQuery = `
        SELECT TOP 10 
          i.InvoiceID,
          i.InvoiceNumber,
          i.TotalAmount,
          i.InvoiceDate,
          c.Buyer_Business_Name as CustomerName,
          'sale' as type
        FROM Invoices i
        LEFT JOIN Customers c ON i.CompanyID = c.CompanyID
        WHERE i.CompanyID = @companyId
        ORDER BY i.InvoiceDate DESC
      `;

      const activitiesResult = await pool
        .request()
        .input("companyId", sql.UniqueIdentifier, companyId)
        .query(activitiesQuery);

      // Get inventory status
      const inventoryQuery = `
        SELECT 
          SUM(CASE WHEN CurrentStock > 10 THEN 1 ELSE 0 END) as inStock,
          SUM(CASE WHEN CurrentStock > 0 AND CurrentStock <= 10 THEN 1 ELSE 0 END) as lowStock,
          SUM(CASE WHEN CurrentStock = 0 THEN 1 ELSE 0 END) as outOfStock
        FROM Inventory 
        WHERE CompanyID = @companyId
      `;

      const inventoryResult = await pool
        .request()
        .input("companyId", sql.UniqueIdentifier, companyId)
        .query(inventoryQuery);

      // Get sales data for chart (last 12 months)
      const salesChartQuery = `
        SELECT 
          FORMAT(InvoiceDate, 'yyyy-MM') as month,
          SUM(TotalAmount) as amount
        FROM Invoices 
        WHERE CompanyID = @companyId 
          AND InvoiceDate >= DATEADD(month, -12, GETDATE())
        GROUP BY FORMAT(InvoiceDate, 'yyyy-MM')
        ORDER BY month
      `;

      const salesChartResult = await pool
        .request()
        .input("companyId", sql.UniqueIdentifier, companyId)
        .query(salesChartQuery);

      const stats = statsResult.recordset[0];
      const activities = activitiesResult.recordset.map((activity) => ({
        id: activity.InvoiceID,
        description: `Invoice ${activity.InvoiceNumber} - ${
          activity.CustomerName || "Unknown Customer"
        }`,
        date: new Date(activity.InvoiceDate).toLocaleDateString(),
        amount: activity.TotalAmount,
        type: activity.type,
      }));

      const inventoryStatus = inventoryResult.recordset[0];
      const salesChart = salesChartResult.recordset;

      res.json({
        success: true,
        data: {
          stats: {
            totalInvoices: stats.totalInvoices || 0,
            totalAmount: stats.totalAmount || 0,
            totalTax: stats.totalTax || 0,
            totalInventory: stats.totalInventory || 0,
            totalCustomers: stats.totalCustomers || 0,
            profit: (stats.totalAmount || 0) - (stats.totalTax || 0), // Simple profit calculation
          },
          recentActivities: activities,
          inventoryStatus: {
            inStock: inventoryStatus.inStock || 0,
            lowStock: inventoryStatus.lowStock || 0,
            outOfStock: inventoryStatus.outOfStock || 0,
          },
          salesChart: salesChart.map((item) => ({
            month: item.month,
            amount: item.amount,
          })),
        },
      });
    } else {
      // Mock data when database is not connected
      res.json({
        success: true,
        data: {
          stats: {
            totalInvoices: 150,
            totalAmount: 750000,
            totalTax: 127500,
            totalInventory: 45,
            totalCustomers: 28,
            profit: 622500,
          },
          recentActivities: [
            {
              id: 1,
              description: "Invoice INV-001 - ABC Company",
              date: new Date().toLocaleDateString(),
              amount: 15000,
              type: "sale",
            },
            {
              id: 2,
              description: "Invoice INV-002 - XYZ Corp",
              date: new Date(Date.now() - 86400000).toLocaleDateString(),
              amount: 25000,
              type: "sale",
            },
          ],
          inventoryStatus: {
            inStock: 35,
            lowStock: 8,
            outOfStock: 2,
          },
          salesChart: [
            { month: "2024-01", amount: 45000 },
            { month: "2024-02", amount: 52000 },
            { month: "2024-03", amount: 48000 },
            { month: "2024-04", amount: 61000 },
            { month: "2024-05", amount: 58000 },
            { month: "2024-06", amount: 67000 },
          ],
        },
      });
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
});

// FBR Compliance Reporting Endpoints

// Get FBR compliance summary report
app.get(
  "/api/reports/fbr-compliance-summary",
  authenticateToken,
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "SUPER_ADMIN"
          ? req.query.companyId
          : req.user.companyId;

      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }

      const request = new sql.Request();
      request.input("companyId", sql.Int, companyId);

      // Get company info with business activity and sector
      const companyResult = await request.query(`
      SELECT Name, BusinessActivity, Sector, NTNNumber
      FROM Companies 
      WHERE CompanyID = @companyId AND IsActive = 1
    `);

      if (companyResult.recordset.length === 0) {
        return res.status(404).json({ message: "Company not found" });
      }

      const company = companyResult.recordset[0];
      const businessActivities = company.BusinessActivity
        ? JSON.parse(company.BusinessActivity)
        : [];
      const sectors = company.Sector ? JSON.parse(company.Sector) : [];

      // Get applicable scenarios from scenario mapping
      const scenarioRequest = new sql.Request();
      let applicableScenarios = new Set();

      for (const activity of businessActivities) {
        for (const sector of sectors) {
          scenarioRequest.input("activity", sql.NVarChar, activity);
          scenarioRequest.input("sector", sql.NVarChar, sector);

          const scenarioResult = await scenarioRequest.query(`
          SELECT applicable_scenarios 
          FROM ScenarioMapping 
          WHERE business_activity = @activity AND sector = @sector AND is_active = 1
        `);

          if (scenarioResult.recordset.length > 0) {
            const scenarios = JSON.parse(
              scenarioResult.recordset[0].applicable_scenarios
            );
            scenarios.forEach((scenario) => applicableScenarios.add(scenario));
          }

          // Clear inputs for next iteration
          scenarioRequest.parameters.clear();
        }
      }

      // Get sales data for compliance calculations
      const salesRequest = new sql.Request();
      salesRequest.input("companyId", sql.Int, companyId);

      const salesResult = await salesRequest.query(`
      SELECT 
        COUNT(*) as TotalInvoices,
        SUM(TotalAmount) as TotalSalesAmount,
        SUM(CASE WHEN FBRInvoiceNumber IS NOT NULL THEN 1 ELSE 0 END) as FBRSubmittedInvoices,
        SUM(CASE WHEN FBRInvoiceNumber IS NOT NULL THEN TotalAmount ELSE 0 END) as FBRSubmittedAmount
      FROM Sales 
      WHERE CompanyID = @companyId
    `);

      const salesData = salesResult.recordset[0];
      const complianceRate =
        salesData.TotalInvoices > 0
          ? (
              (salesData.FBRSubmittedInvoices / salesData.TotalInvoices) *
              100
            ).toFixed(2)
          : 0;

      res.json({
        company: {
          name: company.Name,
          ntnNumber: company.NTNNumber,
          businessActivities,
          sectors,
        },
        applicableScenarios: Array.from(applicableScenarios).sort(),
        compliance: {
          totalInvoices: salesData.TotalInvoices || 0,
          fbrSubmittedInvoices: salesData.FBRSubmittedInvoices || 0,
          complianceRate: parseFloat(complianceRate),
          totalSalesAmount: salesData.TotalSalesAmount || 0,
          fbrSubmittedAmount: salesData.FBRSubmittedAmount || 0,
        },
      });
    } catch (error) {
      console.error("Error generating FBR compliance summary:", error);
      res
        .status(500)
        .json({ message: "Server error while generating compliance report" });
    }
  }
);

// Get detailed FBR scenario usage report
app.get(
  "/api/reports/fbr-scenario-usage",
  authenticateToken,
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "SUPER_ADMIN"
          ? req.query.companyId
          : req.user.companyId;
      const { startDate, endDate } = req.query;

      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }

      const request = new sql.Request();
      request.input("companyId", sql.Int, companyId);

      let dateFilter = "";
      if (startDate && endDate) {
        request.input("startDate", sql.DateTime, new Date(startDate));
        request.input("endDate", sql.DateTime, new Date(endDate));
        dateFilter = "AND InvoiceDate BETWEEN @startDate AND @endDate";
      }

      // Get sales data with scenario information
      const salesResult = await request.query(`
      SELECT 
        InvoiceDate,
        InvoiceNumber,
        CustomerName,
        TotalAmount,
        FBRInvoiceNumber,
        CASE WHEN FBRInvoiceNumber IS NOT NULL THEN 'Submitted' ELSE 'Not Submitted' END as FBRStatus
      FROM Sales 
      WHERE CompanyID = @companyId ${dateFilter}
      ORDER BY InvoiceDate DESC
    `);

      // Get applicable scenarios for the company
      const companyRequest = new sql.Request();
      companyRequest.input("companyId", sql.Int, companyId);

      const companyResult = await companyRequest.query(`
      SELECT BusinessActivity, Sector FROM Companies WHERE CompanyID = @companyId
    `);

      let applicableScenarios = new Set();
      if (companyResult.recordset.length > 0) {
        const company = companyResult.recordset[0];
        const businessActivities = company.BusinessActivity
          ? JSON.parse(company.BusinessActivity)
          : [];
        const sectors = company.Sector ? JSON.parse(company.Sector) : [];

        for (const activity of businessActivities) {
          for (const sector of sectors) {
            const scenarioRequest = new sql.Request();
            scenarioRequest.input("activity", sql.NVarChar, activity);
            scenarioRequest.input("sector", sql.NVarChar, sector);

            const scenarioResult = await scenarioRequest.query(`
            SELECT applicable_scenarios 
            FROM ScenarioMapping 
            WHERE business_activity = @activity AND sector = @sector AND is_active = 1
          `);

            if (scenarioResult.recordset.length > 0) {
              const scenarios = JSON.parse(
                scenarioResult.recordset[0].applicable_scenarios
              );
              scenarios.forEach((scenario) =>
                applicableScenarios.add(scenario)
              );
            }
          }
        }
      }

      res.json({
        applicableScenarios: Array.from(applicableScenarios).sort(),
        salesData: salesResult.recordset.map((sale) => ({
          invoiceDate: sale.InvoiceDate,
          invoiceNumber: sale.InvoiceNumber,
          customerName: sale.CustomerName,
          totalAmount: sale.TotalAmount,
          fbrInvoiceNumber: sale.FBRInvoiceNumber,
          fbrStatus: sale.FBRStatus,
        })),
        summary: {
          totalTransactions: salesResult.recordset.length,
          fbrSubmitted: salesResult.recordset.filter((s) => s.FBRInvoiceNumber)
            .length,
          totalAmount: salesResult.recordset.reduce(
            (sum, s) => sum + (s.TotalAmount || 0),
            0
          ),
        },
      });
    } catch (error) {
      console.error("Error generating FBR scenario usage report:", error);
      res.status(500).json({
        message: "Server error while generating scenario usage report",
      });
    }
  }
);

// Get FBR compliance trends report
app.get(
  "/api/reports/fbr-compliance-trends",
  authenticateToken,
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "SUPER_ADMIN"
          ? req.query.companyId
          : req.user.companyId;

      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }

      const request = new sql.Request();
      request.input("companyId", sql.Int, companyId);

      // Get monthly compliance trends for the last 12 months
      const trendsResult = await request.query(`
      SELECT 
        FORMAT(InvoiceDate, 'yyyy-MM') as Month,
        COUNT(*) as TotalInvoices,
        SUM(CASE WHEN FBRInvoiceNumber IS NOT NULL THEN 1 ELSE 0 END) as FBRSubmittedInvoices,
        SUM(TotalAmount) as TotalAmount,
        SUM(CASE WHEN FBRInvoiceNumber IS NOT NULL THEN TotalAmount ELSE 0 END) as FBRSubmittedAmount
      FROM Sales 
      WHERE CompanyID = @companyId 
        AND InvoiceDate >= DATEADD(MONTH, -12, GETDATE())
      GROUP BY FORMAT(InvoiceDate, 'yyyy-MM')
      ORDER BY Month
    `);

      const trends = trendsResult.recordset.map((trend) => ({
        month: trend.Month,
        totalInvoices: trend.TotalInvoices,
        fbrSubmittedInvoices: trend.FBRSubmittedInvoices,
        complianceRate:
          trend.TotalInvoices > 0
            ? (
                (trend.FBRSubmittedInvoices / trend.TotalInvoices) *
                100
              ).toFixed(2)
            : 0,
        totalAmount: trend.TotalAmount,
        fbrSubmittedAmount: trend.FBRSubmittedAmount,
      }));

      res.json({ trends });
    } catch (error) {
      console.error("Error generating FBR compliance trends:", error);
      res
        .status(500)
        .json({ message: "Server error while generating compliance trends" });
    }
  }
);

// Migration endpoint to add ContactPersonName to Vendors table
app.post("/api/migrate/vendor-contactpersonname", async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    const pool = await sql.connect(dbConfig);

    // Check if column already exists
    const checkColumnQuery = `
      SELECT COUNT(*) as count 
      FROM sys.columns 
      WHERE object_id = OBJECT_ID('Vendors') AND name = 'ContactPersonName'
    `;

    const checkResult = await pool.request().query(checkColumnQuery);

    if (checkResult.recordset[0].count > 0) {
      return res.json({
        success: true,
        message: "ContactPersonName column already exists in Vendors table",
      });
    }

    // Add the column
    const addColumnQuery = `
      ALTER TABLE Vendors ADD ContactPersonName NVARCHAR(255) NULL;
    `;

    await pool.request().query(addColumnQuery);

    // Create index
    const createIndexQuery = `
      CREATE INDEX IX_Vendors_ContactPersonName ON Vendors(ContactPersonName);
    `;

    await pool.request().query(createIndexQuery);

    res.json({
      success: true,
      message:
        "ContactPersonName column and index added to Vendors table successfully",
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message,
    });
  }
});

// Start server
connectToDatabase()
  .then((connected) => {
    // Even if database connection fails, we'll start the server with mock data
    app.listen(PORT, () => {
      if (connected) {
        console.log(`Server running on port ${PORT} with database connection`);
      } else {
        console.log(
          `Server running on port ${PORT} with mock data (no database connection)`
        );
        console.log(
          "Note: All data is mocked for demo purposes. No actual database operations will be performed."
        );
      }
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
