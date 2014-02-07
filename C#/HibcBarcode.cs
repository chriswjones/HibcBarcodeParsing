using System;
using System.Collections;

namespace HibcBarcode
{
	public class HibcBarcode
	{
		public string barcode { get; }

		public string mergedBarcode { get; private set; }

		public BarcodeType barcodeType { get; private set; }

		public string labelerId { get; private set; }

		public string productNumber { get; private set; }

		public string lot{ get; private set; }

		public string serial{ get; private set; }

		public char checkCharacter{ get; private set; }

		public char linkCharacter{ get; private set; }

		public DateTime expirationDate { get; private set; }

		public int unitOfMeasure { get; private set; }

		public int quantity { get; private set; }

		public enum BarcodeType
		{
			Concatenated = 1,
			Primary = 2,
			Secondary = 3,
			Merged = 4
		}

		public enum ResultCode
		{
			Success = 0,
			InvalidBarcode = 1,
			InvalidExpirationDate = 2,
			EmptyCheckCharacter = 3,
			EmptyLinkCharacter = 4,
			InvalidQuantity = 5
		}

		public HibcBarcode (String barcode)
		{
			this.barcode = barcode;
		}

		public ResultCode parse ()
		{
			return parse (this);
		}

		public bool merge (HibcBarcode hibc)
		{
			if (this.barcodeType == BarcodeType.Concatenated ||
			    hibc.barcodeType == BarcodeType.Concatenated ||
			    this.barcodeType == hibc.barcodeType) {
				return false;
			}

			HibcBarcode primary = this.barcodeType == BarcodeType.Primary ? this : hibc;
			HibcBarcode secondary = this.barcodeType == BarcodeType.Secondary ? this : hibc;
			if (!isPair (primary, secondary)) {
				return false;
			}

			this.barcodeType = BarcodeType.Merged;
			if (this == primary) {
				// Merge secondary
				this.mergedBarcode = secondary.barcode;
				this.expirationDate = secondary.expirationDate;
				this.lot = secondary.lot;
				this.quantity = secondary.quantity;
				this.serial = secondary.serial;

			} else {
				// Merge primary
				this.mergedBarcode = primary.barcode;
				this.labelerId = primary.labelerId;
				this.productNumber = primary.productNumber;
				this.unitOfMeasure = primary.unitOfMeasure;
			}

			// Success
			return true;
		}

		public static bool isPair (HibcBarcode primary, HibcBarcode secondary)
		{
			if (!primary || primary.barcodeType != BarcodeType.Primary ||
			    !secondary || secondary.barcodeType != BarcodeType.Secondary) {
				return false;
			}

			return primary.checkCharacter == secondary.linkCharacter;
		}

		private static ResultCode parse (HibcBarcode hibc)
		{
			string barcode = String.Copy (hibc.barcode);
			if (!barcode || this.barcode.Length < 1) {
				return hasError (ResultCode.BarcodeNotHibc);
			}

			// remove leading and trailing *
			Char[] star = new Char[]{ '*' };
			barcode = barcode.TrimStart (star);
			barcode = barcode.TrimStart (star);

			// check for + to be the first char
			if (barcode [0] != '+') {
				return hasError (ResultCode.BarcodeNotHibc);
			} else {
				barcode = barcode.Substring (1);
			}

			// minimum barcode length
			if (barcode.Length < 4) {
				return hasError (ResultCode.InvalidBarcode);
			}

			// the Check Char and Link Char can contain a "/" so remove them to not affect the split
			String potentialChackAndLinkChars = barcode.Substring (barcode.Length - 2);
			barcode = barcode.Remove (barcode.Length - 2);

			// splitting on '/' to get the barcode type
			string[] split = barcode.Split (new Char[]{ '/' });
			if (split.Length == 1) {
				barcode = barcode + potentialChackAndLinkChars;
				if (isLetter (barcode [0])) {

					// Primary
					hibc.barcodeType = BarcodeType.Primary;
					return parsePrimary (hibc, barcode);
				} else {

					// Secondary
					hibc.barcodeType = BarcodeType.Secondary;
					return parseSecondary (hibc, barcode);
				}
			} else if (split.Length == 2) {

				// Concatenated
				hibc.barcodeType = BarcodeType.Concatenated;
				ResultCode rc = parsePrimary (hibc, split [0]);
				if (rc == ResultCode.Success) {
					rc = parsparseSecondaryeLine2 (hibc, split [1] + potentialChackAndLinkChars);
				}
				return rc;
			} else {
				return ResultCode.InvalidBarcode;
			}
		}

		private static ResultCode parsePrimary (HibcBarcode hibc, string barcode)
		{
			if (barcode.Length < 4) {
				return ResultCode.InvalidBarcode;
			}

			// Labeler Id
			hibc.labelerId = barcode.Substring (0, 4);
			barcode = barcode.Remove (0, 4);
			if (barcode.Length < 1) {
				return ResultCode.InvalidBarcode;
			}

			// Check Character. If Concatenated skip this as the check char is in the second part of the barcode
			if (hibc.barcodeType != BarcodeType.Concatenated) {
				hibc.checkCharacter = barcode.Substring (barcode.Length - 1);
				barcode = barcode.Remove (barcode.Length - 1);
				if (barcode.Length < 1) {
					return ResultCode.InvalidBarcode;
				}
			}

			// Unit Of Measure
			hibc.unitOfMeasure = Convert.ToInt32 (barcode.Substring (barcode.Length - 1));
			barcode = barcode.Remove (barcode.Length - 1);

			// Product Number
			hibc.productNumber = barcode;

			return ResultCode.Success;
		}

		private static ResultCode parseSecondary (HibcBarcode hibc, string barcode)
		{
			if (barcode.Length > 0 && isNumber (barcode [0])) {
				if (barcode.Length < 5) {
					return ResultCode.InvalidExpirationDate;
				}

				// Expiration Date
				DateTime date = DateTime.ParseExact (barcode.Substring (0, 5), "YYDDD", null);
				if (!date) {
					return ResultCode.InvalidExpirationDate;
				}
				hibc.expirationDate = date;
				return parseQtyCheckLinkLotSerial (false, hibc, barcode.Substring (5));
			} else if (barcode.Length > 2 && barcode [0] == '$' && isNumber (barcode [1])) {
				return parseQtyCheckLinkLotSerial (false, hibc, barcode.Substring (1));
			} else if (barcode.Length > 3 && barcode.Substring (0, 2) == "$+" && isNumber (barcode [2])) {
				return parseQtyCheckLinkLotSerial (true, hibc, barcode.Substring (2));
			} else if (barcode.Length > 3 && barcode.Substring (0, 2) == "$$" && isNumber (barcode [2])) {
				ResultCode rc = parseQtyCheckLinkLotSerial (false, hibc, barcode.Substring (2));
				if (rc != ResultCode.Success) {
					return rc;
				}
				return extractExpirationDate (hibc);
			} else if (barcode.Length > 3 && barcode.Substring (0, 3) == "$$+") {
				ResultCode rc = parseQtyCheckLinkLotSerial (true, hibc, barcode.Substring (3));
				if (rc != ResultCode.Success) {
					return rc;
				}
				return extractExpirationDate (hibc);
			} else {
				return ResultCode.InvalidBarcode;
			}
		}

		private static ResultCode parseQtyCheckLinkLotSerial (bool isSerialized, HibcBarcode hibc, string barcode)
		{
			if (barcode.Length < 1) {
				return ResultCode.InvalidBarcode;
			}

			// Quantity
			if (isNumber (barcode [0])) {
				int qtyIdentifier = Convert.ToInt32 (barcode [0]);
				int quantityLength;
				switch (qtyIdentifier) {
				case 8:
					quantityLength = 2;
					break;
				case 9:
					quantityLength = 5;
					break;
				default:
					// no qty
					quantityLength = 0;
					break;
				}

				if (quantityLength > 0) {
					
					// Dont include the Qty Identifier in Qty
					hibc.quantity = Convert.ToInt32 (barcode.Substring (1, quantityLength + 1));
					
					// Pull out both the Qty Identifier and Qty
					barcode = barcode.Remove (0, quantityLength + 1);
				}
			}

			// Check Character
			if (barcode.Length < 1) {
				return ResultCode.EmptyCheckCharacter;
			}
			hibc.checkCharacter = barcode.Substring (barcode.Length - 1);
			barcode = barcode.Remove (barcode.Length - 1);

			// Lot / Serial
			HibcProperties lotSerialProperty = isSerialized ? HibcProperties.Serial : HibcProperties.Lot;
			if (hibc.barcodeType == BarcodeType.Secondary) {
				if (barcode.Length < 1) {
					return ResultCode.EmptyLinkCharacter;
				}
				hibc.linkCharacter = barcode.Substring (barcode.Length - 1);
				hibc [lotSerialProperty] = barcode.Remove (barcode.Length - 1);
			} else {
				hibc [lotSerialProperty] = barcode;
			}

			return ResultCode.Success;
		}

		private static ResultCode extractExpirationDate (HibcBarcode hibc)
		{
			string lotOrSerial;
			if (hibc.lot.Length > 0) {
				lotOrSerial = hibc.lot;
			} else if (hibc.serial.Length > 0) {
				lotOrSerial = hibc.serial;
			} else {
				return ResultCode.InvalidExpirationDate;
			}
			 
			int formatIdentifier = Convert.ToInt32 (lotOrSerial [0]);
			string dateFormat;
			switch (formatIdentifier) {
			case 0:
			case 1:
				dateFormat = "MMYY";
				break;
			case 2:
				dateFormat = "MMDDYY";
				break;
			case 3:
				dateFormat = "YYMMDD";
				break;
			case 4:
				dateFormat = "YYMMDDHH";
				break;
			case 5:
				dateFormat = "YYDDD";
				break;
			case 6:
				dateFormat = "YYDDDHH";
				break;
			case 7:
				// no date following 7
				lotOrSerial = lotOrSerial.Remove (0, 1);
				if (hibc.lot.Length > 0) {
					hibc.lot = lotOrSerial;
				} else if (hibc.serial.Length > 0) {
					hibc.lot = lotOrSerial;
				}
				return ResultCode.Success;				
			default:
				// no date
				return ResultCode.Success;
			}

			// Remove formatIdentifier if necessary
			if (formatIdentifier > 1) {
				lotOrSerial = lotOrSerial.Remove (0, 1);	
			}

			// Check format length before date conversion
			if (lotOrSerial.Length < dateFormat.Length) {
				return ResultCode.InvalidExpirationDate;
			}

			// Date conversion
			DateTime date = DateTime.ParseExact (lotOrSerial.Substring (0, dateFormat.Length), dateFormat, null);
			if (!date) {
				return ResultCode.InvalidExpirationDate;
			}

			// Assign the remaining string to either lot or serial
			hibc.expirationDate = date;
			if (hibc.lot.Length > 0) {
				hibc.lot = lotOrSerial;
			} else if (hibc.serial.Length > 0) {
				hibc.serial = lotOrSerial;
			}

			return ResultCode.Success;
		}

		private static bool isLetter (char c)
		{
			return Regex.IsMatch (c, @"^[a-zA-Z]+$");
		}

		private static bool isNumber (char c)
		{
			return Regex.IsMatch (c, @"^[0-9]+$");
		}
	}
}
