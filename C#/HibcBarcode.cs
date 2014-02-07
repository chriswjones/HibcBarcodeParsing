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
			Line1 = 2,
			Line2 = 3
		}

		public enum ResultCode
		{
			Success = 0,
			EmptyBarcode = 1,
			BarcodeNotHibc = 2,
			InvalidBarcode = 3,
			InvalidExpirationDate = 4,
			EmptyCheckCharacter = 5,
			EmptyLinkCharacter = 6,
			InvalidQuantity = 7,
			InvalidLine1 = 8
		}

		private enum HibcProperties
		{
			ResultCode = 1,
			LabelerId = 2,
			ProductNumber = 3,
			Lot = 4,
			Serial = 5,
			CheckCharacter = 6,
			LinkCharacter = 7,
			ExpirationDate = 8,
			BarocodeType = 9,
			MergedBarcode = 10,
			UnitOfMeasure = 11,
			Quantity = 12
		}

		public HibcBarcode (String barcode)
		{
			this.barcode = barcode;
		}

		public ResultCode parse ()
		{
//			Hashtable response = parse (this.barcode);
//			if (response [HibcProperties.ResultCode] == ResultCode.Success) {
//				this.labelerId = response [HibcProperties.LabelerId];
//				this.productNumber = response [HibcProperties.ProductNumber];
//				this.lot = response [HibcProperties.Lot];
//				this.serial = response [HibcProperties.Serial];
//				this.checkCharacter = response [HibcProperties.CheckCharacter];
//				this.linkCharacter = response [HibcProperties.LinkCharacter];
//				this.expirationDate = response [HibcProperties.ExpirationDate];
//				this.unitOfMeasure = response [HibcProperties.UnitOfMeasure];
//				this.quantity = response [HibcProperties.Quantity];
//			}
//			return response [HibcProperties.ResultCode];
			return parse (this);
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

					// Line 1
					hibc.barcodeType = BarcodeType.Line1;
					return parseLine1 (hibc);
				} else {

					// Line 2
					hibc.barcodeType = BarcodeType.Line2;
					return parseLine2 (hibc);
				}
			} else if (split.Length == 2) {

				// Concatenated
				hibc.barcodeType = BarcodeType.Concatenated;
				ResultCode rc = parseLine1 (hibc, split [0]);
				if (rc == ResultCode.Success) {
					rc = parseLine2 (hibc, split [1] + potentialChackAndLinkChars);
				}
				return rc;
			} else {
				return ResultCode.InvalidBarcode;
			}
		}

		private static ResultCode parseLine1 (HibcBarcode hibc, string barcode)
		{
			if (barcode.Length < 4) {
				return ResultCode.InvalidLine1;
			}

			// Labeler Id
			hibc.labelerId = barcode.Substring (0, 4);
			barcode = barcode.Remove (0, 4);
			if (barcode.Length < 1) {
				return ResultCode.InvalidLine1;
			}

			// Check Character. If Concatenated skip this as the check char is in the second part of the barcode
			if (hibc.barcodeType != BarcodeType.Concatenated) {
				hibc.checkCharacter = barcode.Substring (barcode.Length - 1);
				barcode = barcode.Remove (barcode.Length - 1);
				if (barcode.Length < 1) {
					return ResultCode.InvalidLine1;
				}
			}

			// Unit Of Measure
			hibc.unitOfMeasure = Convert.ToInt32 (barcode.Substring (barcode.Length - 1));
			barcode = barcode.Remove (barcode.Length - 1);

			// Product Number
			hibc.productNumber = barcode;

			return ResultCode.Success;
		}

		private static ResultCode parseLine2 (Hashtable hash, string barcode)
		{
			// TODO refactor to be like parseLine1 to return the RC

			ResultCode rc;
			if (barcode.Length > 0 && isNumber (barcode [0])) {
				if (barcode.Length < 5) {
					return hasError (ResultCode.InvalidExpirationDate);
				}

				DateTime date = DateTime.ParseExact (barcode.Substring (0, 5), "YYDDD", null);
				if (!date) {
					hasError (ResultCode.InvalidExpirationDate);
				}
				hash.Add (HibcProperties.ExpirationDate, date);
				rc = parseQtyCheckLink (false, hash, barcode.Substring (5));
			} else if (barcode.Length > 2 && barcode [0] == '$' && isNumber (barcode [1])) {
				rc = parseQtyCheckLink (false, hash, barcode.Substring (1));
			} else if (barcode.Length > 3 && barcode.Substring (0, 2) == "$+" && isNumber (barcode [2])) {
				rc = parseQtyCheckLink (true, hash, barcode.Substring (2));
			} else if (barcode.Length > 3 && barcode.Substring (0, 2) == "$$" && isNumber (barcode [2])) {
				rc = parseQtyCheckLink (false, hash, barcode.Substring (2));
				if (rc != ResultCode.Success) {
					continue;
				}

				// TODO Exp Date from lot
			} else if (barcode.Length > 3 && barcode.Substring (0, 3) == "$$+") {
				rc = parseQtyCheckLink (true, hash, barcode.Substring (3));
				if (rc != ResultCode.Success) {
					continue;
				}

				// TODO Expiration Date from serial
			} else {
				rc = ResultCode.InvalidBarcode;
			}

			return rc;
		}

		private static ResultCode parseQtyCheckLink (bool isSerialized, Hashtable hash, string barcode)
		{
			// TODO refactor to be like parseLine1 and take in HIBC obj, not hash

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
					int qty = Convert.ToInt32 (barcode.Substring (1, quantityLength + 1));
					// Pull out both the Qty Identifier and Qty
					barcode = barcode.Remove (0, quantityLength + 1);
					hash.Add (HibcProperties.Quantity, qty);
				}
			}

			// Check Character
			if (barcode.Length < 1) {
				return ResultCode.EmptyCheckCharacter;
			}
			hash.Add (HibcProperties.CheckCharacter, barcode.Substring (barcode.Length - 1));
			barcode = barcode.Remove (barcode.Length - 1);

			// Lot / Serial
			HibcProperties lotSerialProperty = isSerialized ? HibcProperties.Serial : HibcProperties.Lot;
			if (hash [HibcProperties.BarocodeType] == BarcodeType.Line2) {
				if (barcode.Length < 1) {
					return ResultCode.EmptyLinkCharacter;
				}
				hash.Add (HibcProperties.LinkCharacter, barcode.Substring (barcode.Length - 1));
				hash.Add (lotSerialProperty, barcode.Remove (barcode.Length - 1));
			} else {
				hash.Add (lotSerialProperty, barcode);
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
