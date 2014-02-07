using System;
using System.Collections;

namespace HibcBarcode
{
	public class HibcBarcode
	{
		public string barcode { get; }

		public string mergedBarcode { get; }

		public BarcodeType barcodeType { get; }

		public string labelerId { get; }

		public string productNumber { get; }

		public string lot{ get; set; }

		public string serial{ get; }

		public char checkCharacter{ get; }

		public char linkCharacter{ get; }

		public DateTime expirationDate { get; }

		public int unitOfMeasure { get; }

		public enum BarcodeType {
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
			UnitOfMeasure = 11
		}

		public HibcBarcode (String barcode)
		{
			this.barcode = barcode;
		}

		public ResultCode parse ()
		{
			Hashtable response = parse (this.barcode);
			if (response [HibcProperties.ResultCode] == ResultCode.Success) {
				this.labelerId = response [HibcProperties.LabelerId];
				this.productNumber = response [HibcProperties.ProductNumber];
				this.lot = response [HibcProperties.Lot];
				this.serial = response [HibcProperties.Serial];
				this.checkCharacter = response [HibcProperties.CheckCharacter];
				this.linkCharacter = response [HibcProperties.LinkCharacter];
				this.expirationDate = response [HibcProperties.ExpirationDate];
			}
			return response [HibcProperties.ResultCode];
		}

		private static Hashtable parse (String rawBarcode)
		{
			string barcode = String.Copy (rawBarcode);
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

				// if the first character is a letter, it is a Line1 barcode
				if (Regex.IsMatch (barcode [0], @"^[a-zA-Z]+$")) {
					return parseLine1 (BarcodeType.Line1, barcode);
				} else {
					return parseLine2 (BarcodeType.Line2, barcode);
				}
			} else if (split.Length == 2) {
				// Concatenated
				Hashtable hash1 = parseLine1 (BarcodeType.Concatenated, split[0]);
				if (hash1 [HibcProperties.ResultCode] != ResultCode.Success) {
					return hash1;
				}

				Hashtable hash2 = parseLine2 (BarcodeType.Concatenated, split[1] + potentialChackAndLinkChars);
				if (hash2 [HibcProperties.ResultCode] != ResultCode.Success) {
					return hash2;
				}

				// Merge Hash2 into Hash1
				foreach (DictionaryEntry pair in hash2) {
					hash1.Add (pair.Key, pair.Value);
				}

				return hash1;
			} else {
				return hasError(ResultCode.InvalidBarcode);
			}
		}

		private static Hashtable parseLine1 (BarcodeType barcodeType, string barcode)
		{
			if (barcode.Length < 4) {
				return hasError (ResultCode.InvalidLine1);
			}

			Hashtable hash = new Hashtable ();
			hash.Add (HibcProperties.BarocodeType, barcodeType);

			// Labeler Id
			hash.Add (HibcProperties.LabelerId, barcode.Substring (0, 4));
			barcode = barcode.Remove (0, 4);
			if (barcode.Length < 1) {
				return hasError (ResultCode.InvalidLine1);
			}

			// Check Character. If Concatenated skip this as the check char is in the second part of the barcode
			if (barcodeType != BarcodeType.Concatenated) {
				hash.Add(HibcProperties.CheckCharacter, barcode.Substring(barcode.Length - 1));
				barcode = barcode.Remove (barcode.Length - 1);
				if (barcode.Length < 1) {
					return hasError (ResultCode.InvalidLine1);
				}
			}

			// Unit Of Measure
			string unitOfMeasure = barcode.Substring (barcode.Length - 1);
			hash.Add (HibcProperties.UnitOfMeasure, Convert.ToInt32(unitOfMeasure));
			barcode = barcode.Remove (barcode.Length - 1);
			if (barcode.Length < 1) {
				return hasError (ResultCode.InvalidLine1);
			}

			// Product Number
			hash.Add (HibcProperties.ProductNumber, barcode);

			hash.Add (HibcProperties.ResultCode, ResultCode.Success);
			return hash;
		}

		private static Hashtable parseLine2 (Hashtable response, string barcode) {
			Hashtable hash = new Hashtable ();
			hash.Add (HibcProperties.BarocodeType, barcodeType);

			// TODO

			hash.Add (HibcProperties.ResultCode, ResultCode.Success);
			return hash;
		}

		private static Hashtable hasError (ResultCode rc)
		{
			return new Hashtable (HibcProperties.ResultCode, rc);
		}
	}
}
