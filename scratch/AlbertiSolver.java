import java.util.*;

public class AlbertiSolver {
    public static void main(String[] args) {
        String outer = "ABCDEFGILMNOPQRSTVXZ1234";
        String pt = "SIFVERAPRECISODECIRSIDILOCONVALOR"; // U replaced by V
        String cand = "&xysomqihfdbacegklnprtvz";
        
        int direction = -1;
        int shiftAmount = 3;

        int idxB = cand.indexOf('b');
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < pt.length(); i++) {
            char p = pt.charAt(i);
            int outerIdx = outer.indexOf(p);
            int block = i / 4;
            int innerIdx = (idxB + block * shiftAmount + direction * (outerIdx - 9) + 24 * 1000) % 24;
            sb.append(cand.charAt(innerIdx));
        }

        System.out.println("Expected: zclxcxhztmkpetgpfu&vlhsyskitiafaik");
        System.out.println("Got:      " + sb.toString());
    }
}
